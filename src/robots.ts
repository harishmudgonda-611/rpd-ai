export interface RobotsRule { allow: boolean; path: string }

/** Conservative robots.txt evaluator for common Allow/Disallow prefix and wildcard rules. */
export function robotsAllows(robotsText: string, targetPath: string, userAgent = 'RPD-Product-Intelligence/0.2'): boolean {
  const groups: Array<{ agents: string[]; rules: RobotsRule[] }> = [];
  let agents: string[] = [];
  let rules: RobotsRule[] = [];
  const flush = () => { if (agents.length) groups.push({ agents, rules }); agents = []; rules = []; };
  for (const rawLine of robotsText.split(/\r?\n/)) {
    const line = rawLine.split('#', 1)[0].trim();
    if (!line) continue;
    const separator = line.indexOf(':');
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    if (key === 'user-agent') { if (rules.length) flush(); agents.push(value.toLowerCase()); }
    else if ((key === 'allow' || key === 'disallow') && agents.length && value) rules.push({ allow: key === 'allow', path: value });
  }
  flush();
  const agent = userAgent.toLowerCase();
  const specific = groups.filter(group => group.agents.some(name => name !== '*' && agent.includes(name)));
  const selected = specific.length ? specific : groups.filter(group => group.agents.includes('*'));
  const matching = selected.flatMap(group => group.rules).filter(rule => {
    const pattern = rule.path.replace(/[.+?^$()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\$$/, '$');
    try { return new RegExp('^' + pattern).test(targetPath); } catch { return false; }
  });
  if (!matching.length) return true;
  matching.sort((a, b) => b.path.replace(/[\*$]/g, '').length - a.path.replace(/[\*$]/g, '').length || Number(b.allow) - Number(a.allow));
  return matching[0].allow;
}
