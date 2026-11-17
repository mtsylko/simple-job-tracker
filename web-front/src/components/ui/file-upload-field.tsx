import {
  type DragEvent,
  type SyntheticEvent,
  useId,
  useRef,
  useState
} from 'react';
import { FileText, Upload, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type FileUploadFieldLabels = {
  dropTitle: string;
  dropHint: string;
  uploadingTitle: string;
  uploadingHint: string;
  acceptedFormats: (formats: string) => string;
  maxSize: (sizeMb: number) => string;
  unsupportedFormat: (formats: string) => string;
  tooLarge: (sizeMb: number) => string;
  uploadFailed: string;
  clearFile: string;
};

const DEFAULT_LABELS: FileUploadFieldLabels = {
  dropTitle: 'Drag and drop your file here',
  dropHint: 'or click to browse from your device',
  uploadingTitle: 'Uploading file...',
  uploadingHint: 'Please wait',
  acceptedFormats: (formats) => `Accepted formats: ${formats}`,
  maxSize: (sizeMb) => `Max size: ${sizeMb} MB`,
  unsupportedFormat: (formats) =>
    `Unsupported file format. Accepted formats: ${formats}.`,
  tooLarge: (sizeMb) => `File exceeds max size of ${sizeMb} MB.`,
  uploadFailed: 'Failed to upload file.',
  clearFile: 'Clear selected file'
};

type FileUploadFieldProps = {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  onFileSelect?: (file: File) => Promise<void> | void;
  accept?: string;
  acceptedFormatsLabel?: string;
  maxSizeMb?: number;
  disabled?: boolean;
  className?: string;
  uploadLabel?: string;
  /** 0-100 while an upload is in flight, null or undefined when idle. */
  uploadPercent?: number | null;
  progressLabel?: string;
  /** Overrides for the built-in English copy, for localization. */
  labels?: Partial<FileUploadFieldLabels>;
};

function parseAcceptExtensions(accept: string): string[] {
  return accept
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.startsWith('.'));
}

function isAcceptedFile(file: File, accept: string): boolean {
  const acceptedExtensions = parseAcceptExtensions(accept);
  if (acceptedExtensions.length === 0) {
    return true;
  }

  const lowerCaseFileName = file.name.toLowerCase();
  return acceptedExtensions.some((extension) =>
    lowerCaseFileName.endsWith(extension)
  );
}

function FileUploadField({
  id,
  value,
  onValueChange,
  onFileSelect,
  accept = '.pdf,.jpg,.jpeg,.png',
  acceptedFormatsLabel = 'PDF, JPG, PNG',
  maxSizeMb = 10,
  disabled = false,
  className,
  uploadLabel = 'Upload file',
  uploadPercent = null,
  progressLabel = 'Upload progress',
  labels
}: FileUploadFieldProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const generatedId = useId();
  const inputId = id ?? `file-upload-${generatedId}`;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const helperTextId = `${inputId}-helper`;
  const errorTextId = `${inputId}-error`;
  const describedBy = errorMessage
    ? `${helperTextId} ${errorTextId}`
    : helperTextId;

  const maxSizeBytes = maxSizeMb * 1024 * 1024;
  const progressPercent =
    typeof uploadPercent === 'number'
      ? Math.min(100, Math.max(0, Math.round(uploadPercent)))
      : null;

  function validateFile(file: File): string | null {
    if (!isAcceptedFile(file, accept)) {
      return text.unsupportedFormat(acceptedFormatsLabel);
    }

    if (file.size > maxSizeBytes) {
      return text.tooLarge(maxSizeMb);
    }

    return null;
  }

  async function selectFile(file: File) {
    const validationError = validateFile(file);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setErrorMessage(null);
    if (!onFileSelect) {
      onValueChange(file.name);
      return;
    }

    setIsProcessing(true);
    try {
      await onFileSelect(file);
    } catch (error) {
      if (error instanceof Error && error.message.trim().length > 0) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(text.uploadFailed);
      }
    } finally {
      setIsProcessing(false);
    }
  }

  function openFileDialog() {
    if (disabled || isProcessing) {
      return;
    }

    fileInputRef.current?.click();
  }

  function handleInputChange(event: SyntheticEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (file) {
      void selectFile(file);
    }

    event.currentTarget.value = '';
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    if (disabled || isProcessing) {
      return;
    }

    setIsDragActive(false);

    const droppedFile = event.dataTransfer.files?.[0];
    if (!droppedFile) {
      return;
    }

    void selectFile(droppedFile);
  }

  return (
    <div className={cn('grid gap-2.5', className)}>
      <button
        type="button"
        aria-describedby={describedBy}
        aria-label={uploadLabel}
        onClick={openFileDialog}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled && !isProcessing) {
            setIsDragActive(true);
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled && !isProcessing) {
            setIsDragActive(true);
          }
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragActive(false);
        }}
        onDrop={handleDrop}
        disabled={disabled || isProcessing}
        className={cn(
          'flex min-h-32 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-5 text-center transition-colors',
          'disabled:cursor-not-allowed disabled:opacity-50',
          isDragActive
            ? 'border-ring bg-accent/70'
            : 'border-input bg-secondary/50 hover:border-ring hover:bg-secondary/70',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40'
        )}
      >
        <span
          className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary"
          aria-hidden="true"
        >
          <Upload className="size-4" />
        </span>
        <p className="text-sm font-medium text-foreground">
          {isProcessing ? text.uploadingTitle : text.dropTitle}
        </p>
        <p className="text-xs text-muted-foreground">
          {isProcessing ? text.uploadingHint : text.dropHint}
        </p>
      </button>

      <input
        id={inputId}
        ref={fileInputRef}
        type="file"
        accept={accept}
        disabled={disabled || isProcessing}
        className="sr-only"
        aria-describedby={describedBy}
        onChange={handleInputChange}
      />

      <div
        id={helperTextId}
        className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground"
      >
        <span>{text.acceptedFormats(acceptedFormatsLabel)}</span>
        <span>{text.maxSize(maxSizeMb)}</span>
      </div>

      {value ? (
        <div className="relative isolate flex min-h-11 items-center gap-2 overflow-hidden rounded-md border border-input bg-background px-3">
          {progressPercent !== null ? (
            <span
              role="progressbar"
              aria-label={progressLabel}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progressPercent}
              className="pointer-events-none absolute inset-y-0 left-0 -z-10 bg-primary/10 transition-[width] duration-200"
              style={{ width: `${progressPercent}%` }}
            />
          ) : null}
          <span
            className="flex size-7 shrink-0 items-center justify-center rounded bg-secondary text-muted-foreground"
            aria-hidden="true"
          >
            <FileText className="size-3.5" />
          </span>
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
            {value}
          </p>
          {progressPercent !== null ? (
            <span className="shrink-0 text-2xs tabular-nums text-muted-foreground">
              {progressPercent}%
            </span>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            onClick={() => {
              setErrorMessage(null);
              onValueChange('');
            }}
            disabled={disabled || isProcessing}
          >
            <X className="size-3.5" aria-hidden="true" />
            <span className="sr-only">{text.clearFile}</span>
          </Button>
        </div>
      ) : null}

      {errorMessage ? (
        <p
          id={errorTextId}
          className="text-xs text-destructive"
          aria-live="polite"
        >
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}

export { FileUploadField, type FileUploadFieldLabels };
