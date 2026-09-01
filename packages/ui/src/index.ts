/**
 * @riprap/ui — public API.
 *
 * Layering (meta/primitives/README.md):
 *   tokens.css → lib (pure math/geometry) → atoms → scenes → data stories → motion.
 * Every component is data-bound: props carry the on-chain/numeric values,
 * visuals never invent numbers.
 */

// atoms
export { Arrow } from "./atoms/Arrow";
export { ClaimFiled } from "./atoms/ClaimFiled";
export type { VoteOption } from "./atoms/CommitRevealVote";
export { CommitRevealVote } from "./atoms/CommitRevealVote";
export { Dissolution, StoneTicks } from "./atoms/Dissolution";
export { JurorDraw } from "./atoms/JurorDraw";
export { JurorStone } from "./atoms/JurorStone";
export { MemberStone } from "./atoms/MemberStone";
export { PoolVessel, VESSEL_INTERIOR_W, VESSEL_WALL_H } from "./atoms/PoolVessel";
export { ProRataRefund } from "./atoms/ProRataRefund";
export { Ruling } from "./atoms/Ruling";
export { SponsorRuleCard } from "./atoms/SponsorRuleCard";
export { SvgFrame, SvgText } from "./atoms/SvgFrame";
export { TierCapStations } from "./atoms/TierCapStations";
export { TreasuryPayout } from "./atoms/TreasuryPayout";
export { VesselOutline } from "./atoms/VesselOutline";
// data stories
export { HeavierStormStory } from "./datastories/HeavierStormStory";
export { JurorStory } from "./datastories/JurorStory";
export { StandardStory } from "./datastories/StandardStory";
export { StoryFrame } from "./datastories/StoryFrame";
export { TierLadderStory } from "./datastories/TierLadderStory";
export { WorstCaseWallStory } from "./datastories/WorstCaseWallStory";
// lib
export type { Tier, TierName } from "./lib/poolMath";
export { fillHeight, proRataShare, scaledPayout, TIERS, tierFor, usd } from "./lib/poolMath";
export type { Point, StoneSize } from "./lib/stone";
export { STONE_SIZES, stonePoints, stoneRotation } from "./lib/stone";
export type { TracePoint } from "./lib/trace";
export { moneyY, steppedPath } from "./lib/trace";
// motion
export { BalanceTrace } from "./motion/BalanceTrace";
export { DissolutionScatter } from "./motion/DissolutionScatter";
export { PoolFill } from "./motion/PoolFill";
export { StoneSettle } from "./motion/StoneSettle";
export { WaveBreak } from "./motion/WaveBreak";
// scenes
export { ClaimFlow } from "./scenes/ClaimFlow";
export { EndOfEventFlow } from "./scenes/EndOfEventFlow";
export { JoinFlow } from "./scenes/JoinFlow";
export { LifecycleOverview } from "./scenes/LifecycleOverview";
export type { MonoSegment } from "./scenes/Panel";
export { MonoLine, Panel, SceneTitle } from "./scenes/Panel";
