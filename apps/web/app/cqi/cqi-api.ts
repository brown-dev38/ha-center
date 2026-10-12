import { apiFetch } from '@/app/common/api-fetch'
import { apiHeaders } from '@/app/common/api-headers'
import type { CqiDepartment, CqiDeptSummary, CqiDetail, CqiOutstandingGroup } from '@/app/cqi/cqi'
import { getApiUrl } from '@/app/common/api-url'
import { readApiData, readApiJson } from '@/app/common/parse-api-response'
import { get } from 'http'
import { MeetingManageParticipantsButton } from '../meetings/meeting-manage-participants-button'

export type CqiFormValues = {
  title: string
  description: string
  departmentId: string
  year: number | null
  status: string
  planDetail: string
  doDetail: string
  checkDetail: string
  actDetail: string
  isOutstanding: boolean
  awardName: string
}



async function parseResponse<T>(response: Response): Promise<T> {
  return readApiData<T>(response)
}

export async function fetchCqiDetail(id: string) {
  const response = await apiFetch(`${getApiUrl()}/api/v1/cqi/${id}`, {
    headers: apiHeaders(),
  })
  return parseResponse<CqiDetail>(response)
}

export async function fetchCqiDepartmentsSummary() {
  const response = await apiFetch(`${getApiUrl()}/api/v1/cqi/departments-summary`, {
    headers: apiHeaders(),
  })
  return parseResponse<CqiDeptSummary[]>(response)
}

export async function fetchCqiOutstanding() {
  const response = await apiFetch(`${getApiUrl()}/api/v1/cqi/outstanding`, {
    headers: apiHeaders(),
  })
  return parseResponse<CqiOutstandingGroup[]>(response)
}

export async function fetchCqiDepartments() {
  const response = await apiFetch(`${getApiUrl()}/api/v1/cqi/departments`, {
    headers: apiHeaders(),
  })
  return parseResponse<CqiDepartment[]>(response)
}

export async function createCqiProject(values: CqiFormValues) {
  const response = await apiFetch(`${getApiUrl()}/api/v1/cqi`, {
    method: 'POST',
    headers: apiHeaders(true),
    body: JSON.stringify(values),
  })
  const json = await readApiJson<{ success: boolean; message?: string; error?: string }>(response)
  if (!response.ok || !json.success) {
    throw new Error(json.error ?? json.message ?? 'บันทึกไม่สำเร็จ')
  }
  return json
}



export async function updateCqiProject(id: string, values: CqiFormValues) {
  const response = await apiFetch(`${getApiUrl()}/api/v1/cqi/${id}`, {
    method: 'PATCH',
    headers: apiHeaders(true),
    body: JSON.stringify(values),
  })
  const json = await readApiJson<{ success: boolean; message?: string; error?: string }>(response)
  if (!response.ok || !json.success) {
    throw new Error(json.error ?? json.message ?? 'บันทึกไม่สำเร็จ')
  }
  return json
}


export async function deleteCqiProject(id: string) {
  const response = await apiFetch(`${getApiUrl()}/api/v1/cqi/${id}`, {
    method: 'DELETE',
    headers: apiHeaders(),
  })
  const json = await readApiJson<{ success: boolean; message?: string; error?: string }>(response)
  if (!response.ok || !json.success) {
    throw new Error(json.error ?? json.message ?? 'ลบไม่สำเร็จ')
  }
  return json
}
