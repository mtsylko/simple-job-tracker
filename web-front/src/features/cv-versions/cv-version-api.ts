import type {
  CreateCvVersionInput,
  UpdateCvVersionInput
} from '@job-tracker/shared';
import type {
  CvVersionFormValues,
  CvVersionRow
} from '@/features/cv-versions/types';
import i18n from '@/i18n';
import { apiErrorFallback, parseApiErrorBody, request } from '@/lib/api-client';
import { redirectIfSignedOut } from '@/lib/session-expiry';
import { viewAsHeaders } from '@/lib/view-as';

type ApiCvVersion = {
  _id: unknown;
  name?: unknown;
  description?: unknown;
  attachment?: unknown;
  sourceLink?: unknown;
  enabled?: unknown;
};

const CV_VERSIONS_ENDPOINT = '/api/cv-versions';

function readObjectId(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (value && typeof value === 'object' && '$oid' in value) {
    const oid = (value as { $oid?: unknown }).$oid;
    if (typeof oid === 'string') {
      return oid;
    }
  }

  return '';
}

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function mapApiCvVersion(item: ApiCvVersion): CvVersionRow {
  const id = readObjectId(item._id);
  if (!id) {
    throw new Error(i18n.t('api.invalidId', { ns: 'cvVersions' }));
  }

  return {
    id,
    name: normalizeString(item.name),
    description: normalizeString(item.description),
    attachment: normalizeString(item.attachment),
    sourceLink: normalizeString(item.sourceLink),
    enabled: item.enabled === false ? false : true
  };
}

function toRequestPayload(values: CvVersionFormValues): CreateCvVersionInput {
  return {
    name: values.name,
    description: values.description || null,
    attachment: values.attachment || null,
    sourceLink: values.sourceLink || null,
    enabled: values.enabled
  };
}

export async function patchCvVersionEnabled(
  id: string,
  enabled: boolean
): Promise<CvVersionRow> {
  const payload = await request<ApiCvVersion>(
    `${CV_VERSIONS_ENDPOINT}/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ enabled })
    }
  );
  return mapApiCvVersion(payload);
}

export async function listCvVersions(): Promise<CvVersionRow[]> {
  const payload = await request<ApiCvVersion[]>(CV_VERSIONS_ENDPOINT);
  return payload.map(mapApiCvVersion);
}

export async function createCvVersion(
  values: CvVersionFormValues
): Promise<CvVersionRow> {
  const payload = await request<ApiCvVersion>(CV_VERSIONS_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(toRequestPayload(values))
  });

  return mapApiCvVersion(payload);
}

export async function updateCvVersion(
  id: string,
  values: CvVersionFormValues
): Promise<CvVersionRow> {
  const requestBody: UpdateCvVersionInput = toRequestPayload(values);

  const payload = await request<ApiCvVersion>(
    `${CV_VERSIONS_ENDPOINT}/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(requestBody)
    }
  );

  return mapApiCvVersion(payload);
}

export async function deleteCvVersion(id: string): Promise<void> {
  await request<void>(`${CV_VERSIONS_ENDPOINT}/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
}

function readAttachmentFromUploadBody(body: string): string {
  let payload: { attachment?: unknown };
  try {
    payload = JSON.parse(body) as { attachment?: unknown };
  } catch {
    throw new Error(i18n.t('api.invalidUploadResponse', { ns: 'cvVersions' }));
  }

  if (
    !payload ||
    typeof payload.attachment !== 'string' ||
    payload.attachment.trim().length === 0
  ) {
    throw new Error(i18n.t('api.invalidUploadResponse', { ns: 'cvVersions' }));
  }

  return payload.attachment;
}

// XMLHttpRequest instead of fetch: only XHR reports upload progress events.
export function uploadCvVersionAttachment(
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = `${CV_VERSIONS_ENDPOINT}/upload-attachment`;
    xhr.open('POST', url);
    // Without it, an upload made while viewing another account would land in the admin's own.
    for (const [name, value] of Object.entries(viewAsHeaders(url))) {
      xhr.setRequestHeader(name, value);
    }

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        redirectIfSignedOut(xhr.status);
        reject(
          new Error(
            xhr.status === 401
              ? i18n.t('api.sessionExpired')
              : parseApiErrorBody(
                  xhr.responseText,
                  apiErrorFallback(xhr.statusText)
                )
          )
        );
        return;
      }

      try {
        resolve(readAttachmentFromUploadBody(xhr.responseText));
      } catch (error) {
        reject(error);
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error(i18n.t('api.uploadFailed', { ns: 'cvVersions' })));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error(i18n.t('api.uploadCancelled', { ns: 'cvVersions' })));
    });

    xhr.send(formData);
  });
}
