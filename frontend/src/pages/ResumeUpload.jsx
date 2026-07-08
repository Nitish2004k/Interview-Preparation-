import React, { useEffect, useState, useRef } from "react";
import api from "../api/axios";

export default function ResumeUpload() {
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef(null);

  const load = () => {
    api.get("/resume").then(({ data }) => setResume(data.resume)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleFile = async (file) => {
    if (!file) return;
    setError("");
    setUploading(true);
    const formData = new FormData();
    formData.append("resume", file);
    try {
      await api.post("/resume/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeResume = async () => {
    await api.delete("/resume");
    setResume(null);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="eyebrow">Your resume</p>
        <h1 className="text-2xl font-bold">Upload &amp; manage your resume</h1>
        <p className="mt-1 text-sm text-slate-400">
          Upload a resume to unlock resume-tailored interview questions that reference your real projects and skills.
        </p>
      </div>

      {loading ? (
        <p className="text-slate-400">Loading…</p>
      ) : resume ? (
        <div className="card p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-white">{resume.fileName}</p>
              <p className="mt-1 text-xs text-slate-500">
                Uploaded {new Date(resume.uploadedAt).toLocaleString()}
              </p>
            </div>
            <button onClick={removeResume} className="btn-ghost text-coral !py-1.5 !px-3 text-xs">Remove</button>
          </div>
          {resume.parsedSkills?.length > 0 && (
            <div className="mt-4">
              <p className="label">Detected skills</p>
              <div className="flex flex-wrap gap-2">
                {resume.parsedSkills.map((s) => (
                  <span key={s} className="pill bg-accent/10 text-accent-light">{s}</span>
                ))}
              </div>
            </div>
          )}
          <button
            onClick={() => fileInput.current?.click()}
            className="btn-secondary mt-5 !py-1.5 !px-3 text-xs"
          >
            Replace resume
          </button>
        </div>
      ) : null}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        onClick={() => fileInput.current?.click()}
        className={`card flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed p-10 text-center transition ${
          dragOver ? "border-accent-light bg-accent/5" : "border-ink-600"
        }`}
      >
        <p className="font-medium text-white">
          {uploading ? "Uploading…" : "Drop your resume here, or click to browse"}
        </p>
        <p className="text-xs text-slate-500">PDF, DOC, DOCX, or TXT · up to 5MB</p>
        <input
          ref={fileInput}
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      {error && <p className="rounded-lg bg-coral/10 px-3 py-2 text-sm text-coral">{error}</p>}
    </div>
  );
}
