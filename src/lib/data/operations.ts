import {
  getMockAgentDefinition,
  getMockFlowDefinition,
  getMockOperationsSnapshot,
  getMockRunDetail,
  getMockWorkspaceAdminSnapshot,
} from "@nasaq/mock-api";

export async function getOperationsData() {
  return getMockOperationsSnapshot();
}

export async function getAgentData(id: string) {
  return getMockAgentDefinition(id);
}

export async function getFlowData(id: string) {
  return getMockFlowDefinition(id);
}

export async function getRunData(id: string) {
  return getMockRunDetail(id);
}

export async function getWorkspaceAdminData() {
  return getMockWorkspaceAdminSnapshot();
}
