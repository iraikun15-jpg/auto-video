import React from "react";
import { LL, polyPath, project } from "../jimmu/geo";
import { MapLayer, Stage, Stamp } from "../jimmu/paper";
import { Person, Sun } from "../jimmu/figures";
import { MINCHO, PAPER, SHU, SUMI } from "../jimmu/theme";
import { LANDS_ALL } from "../takeru/geo";

/** サムネイル：上に赤判子「出自は謎」、中央に近江→大和の移動ルート、下に大きなタイトル＋継体の影 */
export const KeitaiThumbnail: React.FC = () => {
  const cam = { lon: 135.86, lat: 34.97, zoom: 6.0, cy: 760 };
  const P = (ll: LL) => project(cam, ll);
  const lake: LL[] = [[136.02, 35.55], [136.2, 35.48], [136.27, 35.3], [136.12, 35.12], [135.98, 35.02], [135.93, 34.98], [135.88, 35.05], [135.95, 35.2], [135.98, 35.38]];
  const route: LL[] = [[136.02, 35.36], [135.96, 35.18], [135.86, 35.0], [135.68, 34.86], [135.79, 34.81], [135.7, 34.93], [135.76, 34.8], [135.82, 34.66], [135.84, 34.52]];
  const stops: LL[] = [[136.02, 35.36], [135.68, 34.86], [135.79, 34.81], [135.7, 34.93], [135.84, 34.52]];
  const big = (s: string, y: number, size: number, x = 450) => (
    <text x={x} y={y} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={size} fill={SUMI} stroke={PAPER} strokeWidth={22} paintOrder="stroke">
      {s}
    </text>
  );
  return (
    <Stage peel={false} look="keitai">
      <MapLayer cam={cam} lands={LANDS_ALL} />
      <clipPath id="tclip">
        <rect x={40} y={330} width={1000} height={900} rx={6} />
      </clipPath>
      <g clipPath="url(#tclip)">
        <path d={polyPath(lake.map(P))} fill="#3E6688" />
        <path d={polyPath(route.map(P), false)} fill="none" stroke={SHU} strokeWidth={12} strokeDasharray="4 18" strokeLinecap="round" />
        {stops.map((s, i) => {
          const p = P(s);
          return <circle key={i} cx={p[0]} cy={p[1]} r={20} fill={i === stops.length - 1 ? SHU : PAPER} stroke={SUMI} strokeWidth={6} />;
        })}
        <text x={P([136.12, 35.22])[0]} y={P([136.12, 35.22])[1]} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={80} fill={SUMI} opacity={0.3}>
          近江
        </text>
        <text x={P([135.95, 34.6])[0]} y={P([135.95, 34.6])[1]} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={80} fill={SUMI} opacity={0.3}>
          大和
        </text>
        <text x={P([135.6, 34.75])[0]} y={P([135.6, 34.75])[1]} textAnchor="middle" fontFamily={MINCHO} fontWeight={800} fontSize={200} fill={SHU} opacity={0.85}>
          ？
        </text>
      </g>
      <Sun x={950} y={1380} r={100} />
      <Person kind="keitai" x={950} y={1850} scale={0.78} flip arm={60} outline outlineColor={SUMI} />
      {big("継体天皇は", 1400, 130)}
      {big("実在したのか", 1580, 120)}
      <Stamp x={540} y={205} text="出自は謎" size={140} t={1} rot={-5} />
    </Stage>
  );
};
