import { ArrowUpRight, BookOpen, Clock3 } from "lucide-react";
import type {
  EvidenceSource,
  SourcedFact,
  TravelPlace,
  TransferReference,
} from "@/lib/travel-types";
import "./travel-research.css";

export function EvidenceSources({ sources }: { sources: EvidenceSource[] }) {
  return (
    <div className="tr-sources">
      <h4>
        <BookOpen size={14} /> 来源与核对日期
      </h4>
      <ul>
        {sources.map((source) => (
          <li key={source.id}>
            <a href={source.url} target="_blank" rel="noreferrer">
              {source.title}
              <ArrowUpRight size={13} />
            </a>
            <span>核对于 {source.checkedOn}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Fact({
  label,
  fact,
  sources,
}: {
  label: string;
  fact: SourcedFact;
  sources: EvidenceSource[];
}) {
  return (
    <div className="tr-fact">
      <dt>
        {label}
        <span
          className={fact.status === "unknown" ? "tr-unknown" : "tr-sourced"}
        >
          {fact.status === "unknown" ? "待确认" : "有来源"}
        </span>
      </dt>
      <dd>{fact.text}</dd>
      {fact.sourceIds.length > 0 && (
        <dd className="tr-fact-links">
          {fact.sourceIds.map((id) => {
            const source = sources.find((item) => item.id === id);
            return source ? (
              <a key={id} href={source.url} target="_blank" rel="noreferrer">
                查看依据 <ArrowUpRight size={11} />
              </a>
            ) : null;
          })}
        </dd>
      )}
    </div>
  );
}

export function PlaceEvidence({
  place,
  compact = false,
}: {
  place: TravelPlace;
  compact?: boolean;
}) {
  return (
    <div className={`tr-evidence ${compact ? "tr-evidence-compact" : ""}`}>
      <p className="tr-address">{place.address}</p>
      {place.knownClosedDates && place.knownClosedDates.length > 0 && (
        <p className="tr-closure">
          来源已注明闭馆日期：{place.knownClosedDates.join("、")}
          。出发前请再查看官方通知。
        </p>
      )}
      <dl className="tr-facts">
        {!compact && (
          <Fact
            label="参观方式"
            fact={place.visiting}
            sources={place.sources}
          />
        )}
        <Fact label="开放参考" fact={place.opening} sources={place.sources} />
        <Fact
          label="门票与费用"
          fact={place.admission}
          sources={place.sources}
        />
        {!compact && (
          <Fact label="预约" fact={place.booking} sources={place.sources} />
        )}
      </dl>
      {!compact && (
        <>
          <p className="tr-duration">
            <Clock3 size={14} /> 建议预留 {place.suggestedMinutes} 分钟{" "}
            <span>{place.durationBasis}</span>
          </p>
          <p className="tr-caveat">
            {place.openingCaveat} 坐标为近似位置，不作为入口导航。
          </p>
          <EvidenceSources sources={place.sources} />
        </>
      )}
    </div>
  );
}

export function TransferEvidence({
  reference,
  reverse = false,
}: {
  reference: TransferReference;
  reverse?: boolean;
}) {
  return (
    <div className="tr-transfer-evidence">
      <p>{reference.route}</p>
      <p className="tr-muted">{reference.serviceSummary}</p>
      <div className="tr-transfer-numbers">
        <div>
          <span>官方旅时参考</span>
          <strong>
            {reference.referenceMinutes === null
              ? "待确认"
              : `${reference.referenceMinutes} 分钟`}
          </strong>
          <small>{reference.referenceText}</small>
        </div>
        <div>
          <span>检查时预留 · 项目估算</span>
          <strong>
            {reference.planningRideMinutes + reference.bufferMinutes} 分钟
          </strong>
          <small>
            乘车 {reference.planningRideMinutes} + 转场缓冲{" "}
            {reference.bufferMinutes} 分钟
          </small>
        </div>
      </div>
      <p className="tr-caveat">{reference.planningBasis}</p>
      <p className="tr-caveat">
        {reference.caveat}
        {reverse &&
          " 当前为反方向，沿用这组城市间的估算；具体车次与换乘需按出发方向复核。"}
      </p>
      <EvidenceSources sources={reference.sources} />
    </div>
  );
}
