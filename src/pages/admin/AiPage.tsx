import { useMemo } from 'react';
import { Notice } from '@/components/ui/bits';
import { Donut, Kpi, RankBars, SampleTag } from '@/components/charts/Charts';
import { PortalHead, useFmt } from '@/features/portal/shared';
import { useAdminT } from '@/features/portal/admin';
import { AI_MODEL, useAiLog, type AiInteraction } from '@/services/aiTelemetry';
import { seedIndex } from '@/services/catalog';
import { DATA_SOURCE } from '@/services/http';
import { seeded, addDays, todayIso } from '@/lib/random';

/** Fictional sample interactions so the dashboard has volume; real ones from this device are listed first. */
function sampleLog(): AiInteraction[] {
  const rnd = seeded('ai-sample');
  const prompts = [
    ['7 days in Tanzania, wildlife and beach, $5,000 for two', 'plan'], ['Best time to visit the Serengeti?', 'season'], ['Compare Zanzibar and Mafia', 'compare'],
    ['Do I need a visa for Tanzania?', 'entry'], ['Safari familial 5 jours en Tanzanie', 'plan'], ['Wetter in Sansibar im April', 'weather'],
    ['坦桑尼亚 野生动物 10天', 'plan'], ['Viaggio di nozze Zanzibar 8 giorni', 'plan'], ['Kilimanjaro Machame route cost', 'plan'], ['Is Katavi good in March?', 'season']
  ] as const;
  return Array.from({ length: 120 }, (_, i) => {
    const [prompt, type] = prompts[rnd.int(0, prompts.length - 1)]!;
    const ok = rnd.next() > 0.04;
    return {
      id: `s-${i}`, at: `${addDays(todayIso(), -rnd.int(0, 29))}T${String(rnd.int(6, 22)).padStart(2, '0')}:00:00Z`, lang: rnd.pick(['en', 'en', 'fr', 'de', 'zh', 'it']),
      prompt, type: ok ? type : 'error', latencyMs: rnd.int(700, 2400), ok, flags: rnd.next() < 0.03 ? ['personal_data'] : [], model: AI_MODEL, sample: true,
      feedback: rnd.next() < 0.35 ? (rnd.next() < 0.82 ? 'up' : 'down') : undefined,
      destinations: type === 'plan' ? [rnd.pick(['serengeti', 'zanzibar', 'ngorongoro', 'tarangire', 'kilimanjaro'])] : undefined
    };
  });
}

export default function AdminAiPage() {
  const { t } = useAdminT();
  const f = useFmt();
  const live = useAiLog();
  const all = useMemo(() => [...live, ...sampleLog()], [live]);
  const ok = all.filter(x => x.ok);
  const plans = all.filter(x => x.type === 'plan');
  const withFb = all.filter(x => x.feedback);
  const positive = withFb.filter(x => x.feedback === 'up').length;
  const flagged = all.filter(x => x.flags.length);
  const avgLatency = ok.length ? Math.round(ok.reduce((s, x) => s + x.latencyMs, 0) / ok.length) : 0;
  const popular = useMemo(() => {
    const m = new Map<string, number>();
    all.forEach(x => m.set(x.prompt.toLowerCase(), (m.get(x.prompt.toLowerCase()) ?? 0) + 1));
    return [...m].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [all]);
  const recs = useMemo(() => {
    const m = new Map<string, number>();
    plans.forEach(x => x.destinations?.forEach(d => m.set(d, (m.get(d) ?? 0) + 1)));
    return [...m].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [plans]);
  const types = (['plan', 'season', 'compare', 'entry', 'weather', 'error'] as const).map(k => ({ label: t(`admin:ai.type.${k}`), value: all.filter(x => x.type === k).length }));
  const failed = all.filter(x => !x.ok).slice(0, 6);

  return (
    <>
      <PortalHead title={t('admin:nav.ai')} text={t('admin:ai.text')} />
      <Notice icon="info">{t('admin:ai.dataNote', { count: live.length })}</Notice>
      <div className="kpis">
        <Kpi icon="sparkles" label={t('admin:ai.interactions')} value={f.n(all.length)} />
        <Kpi icon="calendar" label={t('admin:ai.itineraries')} value={f.n(plans.length)} />
        <Kpi icon="check" label={t('admin:ai.successRate')} value={f.pct(all.length ? ok.length / all.length : 0, 1)} />
        <Kpi icon="star" label={t('admin:ai.satisfaction')} value={withFb.length ? f.pct(positive / withFb.length, 0) : '—'} hint={t('admin:ai.ratings', { count: withFb.length })} />
        <Kpi icon="clock" label={t('admin:ai.latency')} value={`${f.n(avgLatency)} ms`} />
        <Kpi icon="shield" label={t('admin:ai.flags')} value={f.n(flagged.length)} />
      </div>
      <p className="small muted"><SampleTag /> {t('admin:ai.sampleNote')}</p>

      <div className="p-grid2">
        <section className="panel" aria-labelledby="ai-pop"><h2 id="ai-pop" style={{ marginBottom: 12 }}>{t('admin:ai.popular')}</h2>
          <ol className="rank" style={{ listStyle: 'none' }}>{popular.map(([q, n]) => <li key={q} style={{ gridTemplateColumns: 'minmax(0, 1fr) auto' }}><span className="rank-label">{q}</span><b>{n}</b></li>)}</ol></section>
        <section className="panel" aria-labelledby="ai-type"><h2 id="ai-type" style={{ marginBottom: 12 }}>{t('admin:ai.answerTypes')}</h2>
          <Donut label={t('admin:ai.answerTypes')} items={types} /></section>
      </div>

      <div className="p-grid2">
        <section className="panel" aria-labelledby="ai-rec"><h2 id="ai-rec" style={{ marginBottom: 12 }}>{t('admin:ai.recommendations')}</h2>
          <RankBars label={t('admin:ai.recommendations')} items={recs.map(([id, n]) => ({ key: id, label: seedIndex.destById.get(id)?.name ?? id, value: n }))} />
          <p className="small muted" style={{ marginTop: 8 }}>{t('admin:ai.recNote')}</p></section>
        <section className="panel" aria-labelledby="ai-fail"><h2 id="ai-fail" style={{ marginBottom: 12 }}>{t('admin:ai.failed')}</h2>
          {failed.length ? <ul className="list">{failed.map(x => <li key={x.id} className="list-item"><span className="grow"><b style={{ whiteSpace: 'normal' }}>{x.prompt}</b><small>{f.dt(x.at)} · {x.lang.toUpperCase()}{x.sample ? ` · ${t('business:sample.label')}` : ''}</small></span></li>)}</ul> : <p className="muted">{t('admin:ai.noFailures')}</p>}</section>
      </div>

      <section className="panel" aria-labelledby="ai-safety"><h2 id="ai-safety" style={{ marginBottom: 12 }}>{t('admin:ai.safety')}</h2>
        {flagged.length ? <div className="table-wrap" style={{ border: 0 }}><table className="dtable"><thead><tr><th scope="col">{t('admin:ai.prompt')}</th><th scope="col">{t('admin:ai.flag')}</th><th scope="col">{t('admin:ai.when')}</th></tr></thead>
          <tbody>{flagged.slice(0, 10).map(x => <tr key={x.id}><td>{x.prompt}</td><td>{x.flags.map(fl => t(`admin:ai.flagKind.${fl}`)).join(', ')}</td><td>{f.dt(x.at)}</td></tr>)}</tbody></table></div>
          : <p className="muted">{t('admin:ai.noFlags')}</p>}
        <p className="small muted" style={{ marginTop: 8 }}>{t('admin:ai.redaction')}</p></section>

      <section className="panel" aria-labelledby="ai-model"><h2 id="ai-model" style={{ marginBottom: 12 }}>{t('admin:ai.models')}</h2>
        <dl className="kv">
          <dt>{t('admin:ai.activeModel')}</dt><dd>{AI_MODEL} · {t('admin:ai.rulesModel')}</dd>
          <dt>{t('admin:ai.dataSource')}</dt><dd>{DATA_SOURCE === 'http' ? t('admin:ai.gateway') : t('admin:ai.onDevice')}</dd>
          <dt>{t('admin:ai.cost')}</dt><dd>{f.m2(0)} · {t('admin:ai.costNote')}</dd>
        </dl>
        <Notice icon="layers">{t('admin:ai.replaceable')}</Notice></section>
    </>
  );
}
