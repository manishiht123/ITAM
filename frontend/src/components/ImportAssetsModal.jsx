import { useState, useRef, useCallback } from "react";
import {
  FaUpload, FaFileCsv, FaCheckCircle, FaTimesCircle,
  FaExclamationTriangle, FaDownload, FaTimes, FaArrowRight, FaRedo
} from "react-icons/fa";
import api from "../services/api";
import { useToast } from "../context/ToastContext";
import "./ImportAssetsModal.css";

// ── Step indicator ────────────────────────────────────────────────────────────
function StepBar({ step }) {
  const steps = ["Upload", "Preview", "Results"];
  return (
    <div className="im-step-bar">
      {steps.map((label, i) => (
        <div key={i} className={`im-step ${i < step ? "done" : i === step ? "active" : ""}`}>
          <span className="im-step-num">{i < step ? <FaCheckCircle /> : i + 1}</span>
          <span className="im-step-label">{label}</span>
          {i < steps.length - 1 && <span className="im-step-connector" />}
        </div>
      ))}
    </div>
  );
}

// ── Step 0: File Upload ───────────────────────────────────────────────────────
function UploadStep({ entityCode, onPreview }) {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();
  const toast = useToast();

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith(".csv") || f.name.endsWith(".xlsx") || f.name.endsWith(".xls"))) {
      setFile(f);
    } else {
      toast.warning("Please upload a CSV or Excel file.");
    }
  }, []);

  const handlePick = (e) => {
    const f = e.target.files[0];
    if (f) setFile(f);
    e.target.value = null;
  };

  const handleValidate = async () => {
    if (!file) { toast.warning("Please select a file first."); return; }
    if (!entityCode || entityCode === "ALL") {
      toast.warning("Please select a specific entity before importing.");
      return;
    }
    setLoading(true);
    try {
      const result = await api.importAssets(file, entityCode, true); // dryRun
      onPreview(file, result);
    } catch (err) {
      toast.error(err.message || "Validation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="im-step-content">
      <p className="im-hint">
        Upload a CSV or Excel file. All rows will be validated before importing.
        <br />Entity: <strong>{entityCode || "—"}</strong>
      </p>

      <div
        className={`im-drop-zone ${dragging ? "dragging" : ""} ${file ? "has-file" : ""}`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current.click()}
      >
        <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: "none" }} onChange={handlePick} />
        {file ? (
          <>
            <FaFileCsv className="im-drop-icon im-icon-green" />
            <p className="im-drop-name">{file.name}</p>
            <p className="im-drop-size">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
          </>
        ) : (
          <>
            <FaUpload className="im-drop-icon" />
            <p className="im-drop-title">Drag & drop your file here</p>
            <p className="im-drop-sub">or <span className="im-link">browse</span> · CSV, XLSX, XLS</p>
          </>
        )}
      </div>

      <div className="im-template-row">
        <FaDownload className="im-template-icon" />
        Need the column template?
        <button className="im-link-btn" onClick={downloadTemplate}>Download template.csv</button>
      </div>

      <div className="im-footer">
        <button className="im-btn im-btn-primary" onClick={handleValidate} disabled={!file || loading}>
          {loading ? "Validating…" : <><FaArrowRight style={{ marginRight: 6 }} />Validate & Preview</>}
        </button>
      </div>
    </div>
  );
}

// ── Step 1: Preview ───────────────────────────────────────────────────────────
function PreviewStep({ file, preview, entityCode, onResults, onBack }) {
  const { validCount, invalidCount, rows } = preview;
  const [skipErrors, setSkipErrors] = useState(invalidCount > 0);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const [showAll, setShowAll] = useState(false);

  const handleImport = async () => {
    if (validCount === 0) { toast.warning("No valid rows to import."); return; }
    setLoading(true);
    try {
      const result = await api.importAssets(file, entityCode, false, skipErrors);
      onResults(result);
    } catch (err) {
      toast.error(err.message || "Import failed.");
    } finally {
      setLoading(false);
    }
  };

  const displayed = showAll ? rows : rows.slice(0, 50);

  return (
    <div className="im-step-content">
      {/* Summary bar */}
      <div className="im-summary-bar">
        <div className="im-summary-item im-summary-valid">
          <FaCheckCircle />
          <span><strong>{validCount}</strong> valid rows</span>
        </div>
        {invalidCount > 0 && (
          <div className="im-summary-item im-summary-invalid">
            <FaTimesCircle />
            <span><strong>{invalidCount}</strong> invalid rows</span>
          </div>
        )}
        <div className="im-summary-item im-summary-total">
          <span>Total: {rows.length} rows</span>
        </div>
      </div>

      {/* Skip errors toggle */}
      {invalidCount > 0 && (
        <label className="im-skip-toggle">
          <input type="checkbox" checked={skipErrors} onChange={e => setSkipErrors(e.target.checked)} />
          Skip invalid rows and import {validCount} valid row{validCount !== 1 ? "s" : ""}
        </label>
      )}

      {/* Preview table */}
      <div className="im-preview-table-wrap">
        <table className="im-preview-table">
          <thead>
            <tr>
              <th>Row</th>
              <th>Asset ID</th>
              <th>Name / Model</th>
              <th>Category</th>
              <th>Status</th>
              <th>Department</th>
              <th>Location</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map(r => (
              <tr key={r.rowNum} className={r.valid ? "im-row-valid" : "im-row-invalid"}>
                <td className="im-cell-num">{r.rowNum}</td>
                <td className="im-cell-id">{r.assetId || <em style={{ color: "var(--text-muted)" }}>—</em>}</td>
                <td>{r.name || "—"}</td>
                <td>{r.category || "—"}</td>
                <td>{r.status || "—"}</td>
                <td>{r.department || "—"}</td>
                <td>{r.location || "—"}</td>
                <td>
                  {r.valid ? (
                    <span className="im-row-badge im-badge-ok"><FaCheckCircle /> Valid</span>
                  ) : (
                    <span className="im-row-badge im-badge-err" title={r.errors.join("; ")}>
                      <FaTimesCircle /> {r.errors[0]}{r.errors.length > 1 ? ` (+${r.errors.length - 1})` : ""}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!showAll && rows.length > 50 && (
          <div className="im-show-more">
            <button className="im-link-btn" onClick={() => setShowAll(true)}>
              Show all {rows.length} rows
            </button>
          </div>
        )}
      </div>

      <div className="im-footer">
        <button className="im-btn im-btn-ghost" onClick={onBack} disabled={loading}>Back</button>
        <button
          className="im-btn im-btn-primary"
          onClick={handleImport}
          disabled={loading || validCount === 0 || (invalidCount > 0 && !skipErrors)}
        >
          {loading ? "Importing…" : (
            <>
              <FaCheckCircle style={{ marginRight: 6 }} />
              Import {skipErrors ? validCount : rows.length} Row{rows.length !== 1 ? "s" : ""}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Step 2: Results ───────────────────────────────────────────────────────────
function ResultsStep({ results, onClose, onImportMore }) {
  const { imported, skipped, errors } = results;
  const success = imported > 0;

  return (
    <div className="im-step-content im-results">
      <div className={`im-result-hero ${success ? "im-result-success" : "im-result-warn"}`}>
        {success
          ? <FaCheckCircle className="im-result-icon" />
          : <FaExclamationTriangle className="im-result-icon" />
        }
        <h2 className="im-result-title">
          {imported} Asset{imported !== 1 ? "s" : ""} Imported
        </h2>
        {skipped > 0 && (
          <p className="im-result-sub">{skipped} row{skipped !== 1 ? "s" : ""} skipped due to errors</p>
        )}
      </div>

      {errors && errors.length > 0 && (
        <div className="im-error-list">
          <p className="im-error-list-title"><FaExclamationTriangle /> Skipped rows:</p>
          <div className="im-error-table-wrap">
            <table className="im-error-table">
              <thead>
                <tr><th>Row</th><th>Asset ID</th><th>Error</th></tr>
              </thead>
              <tbody>
                {errors.map((e, i) => (
                  <tr key={i}>
                    <td>{e.row}</td>
                    <td>{e.assetId || "—"}</td>
                    <td>{e.error}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="im-footer">
        <button className="im-btn im-btn-ghost" onClick={onImportMore}>
          <FaRedo style={{ marginRight: 6 }} />Import More
        </button>
        <button className="im-btn im-btn-primary" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}

// ── Template download helper ──────────────────────────────────────────────────
function downloadTemplate() {
  const headers = [
    "S. No","Employee ID","Asset ID","Employee Mail","Employee Name",
    "Asset Status","Faulty laptop Issue","Department","Location","Asset Type",
    "Additional Items","Make/Model","Serial Number","Asset Owner","SSD/HDD",
    "RAM SIZE","CPU","OS","Date of Purchase","Warranty Expire Date","Price",
    "Invoice Number","Vendor Name","Last User","Insurance Status",
    "MS Office Email","Windows Keys","Laptop Allocation Date"
  ];
  const csv = [headers.join(","), new Array(headers.length).fill("").join(",")].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = "assets_import_template.csv";
  a.click();
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export default function ImportAssetsModal({ entityCode, onClose, onImported }) {
  const [step, setStep]       = useState(0);
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState(null);
  const [results, setResults] = useState(null);

  const handlePreview = (f, previewData) => {
    setFile(f);
    setPreview(previewData);
    setStep(1);
  };

  const handleResults = (r) => {
    setResults(r);
    setStep(2);
    if (r.imported > 0 && onImported) onImported();
  };

  const reset = () => {
    setStep(0);
    setFile(null);
    setPreview(null);
    setResults(null);
  };

  return (
    <div className="im-overlay">
      <div className="im-modal">
        {/* Header */}
        <div className="im-header">
          <div>
            <h2 className="im-title"><FaFileCsv className="im-title-icon" /> Bulk Asset Import</h2>
            <p className="im-subtitle">Import multiple assets from a CSV or Excel file</p>
          </div>
          <button className="im-close" onClick={onClose}><FaTimes /></button>
        </div>

        <StepBar step={step} />

        {step === 0 && (
          <UploadStep entityCode={entityCode} onPreview={handlePreview} />
        )}
        {step === 1 && preview && (
          <PreviewStep
            file={file}
            preview={preview}
            entityCode={entityCode}
            onResults={handleResults}
            onBack={reset}
          />
        )}
        {step === 2 && results && (
          <ResultsStep results={results} onClose={onClose} onImportMore={reset} />
        )}
      </div>
    </div>
  );
}
