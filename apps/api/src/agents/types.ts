export type AgentIntent =
  | "SALES"
  | "DOCUMENTATION"
  | "UNDERWRITING"
  | "UNKNOWN";

export interface MasterAgentInput {
  // sessionId: number;
  message: string;
  loanId?: number
}
