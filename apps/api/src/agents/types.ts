export type AgentIntent =
  | "SALES"
  | "DOCUMENTATION"
  | "UNDERWRITING"
  | "UNKNOWN";

export interface MasterAgentInput {
  sessionId: string;
  message: string;
  loanId:number
}
