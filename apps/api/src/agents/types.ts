export type AgentIntent =
  | "SALES"
  | "DOCUMENTATION"
  | "UNDERWRITING"
  | "UNKNOWN";

export interface MasterAgentInput {
  sessionId: Number;
  message: string;
}
