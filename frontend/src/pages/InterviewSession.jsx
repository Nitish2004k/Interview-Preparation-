import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import ScorePill from "../components/ScorePill";

// Web Speech API helpers (voice mode). Falls back gracefully if unsupported.
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1;
  utter.pitch = 1;
  window.speechSynthesis.speak(utter);
}

export default function InterviewSession() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [current, setCurrent] = useState(0);
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastFeedback, setLastFeedback] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState("");

  const recognitionRef = useRef(null);
  const voiceSupported = !!SpeechRecognition;

  useEffect(() => {
    api.get(`/interviews/${id}`).then(({ data }) => {
      setInterview(data.interview);
      const firstUnanswered = data.interview.questions.findIndex((q) => !q.answeredAt);
      setCurrent(firstUnanswered === -1 ? 0 : firstUnanswered);
    });
  }, [id]);

  useEffect(() => {
    if (interview?.mode === "voice" && interview.questions[current] && voiceSupported) {
      speak(interview.questions[current].text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, interview]);

  const question = interview?.questions[current];

  const startListening = () => {
    if (!voiceSupported) return;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    let finalTranscript = answer ? answer + " " : "";
    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript += transcript + " ";
        else interim += transcript;
      }
      setAnswer(finalTranscript + interim);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const submitAnswer = async () => {
    setSubmitting(true);
    setError("");
    try {
      const { data } = await api.post(`/interviews/${id}/answer`, {
        questionId: question._id,
        answerText: answer,
        answeredViaVoice: interview.mode === "voice",
      });
      setLastFeedback(data.question.feedback);
      setInterview((prev) => ({
        ...prev,
        questions: prev.questions.map((q) => (q._id === data.question._id ? data.question : q)),
      }));
    } catch (err) {
      setError(err.response?.data?.message || "Could not submit answer");
    } finally {
      setSubmitting(false);
    }
  };

  const nextQuestion = () => {
    setAnswer("");
    setLastFeedback(null);
    if (current < interview.questions.length - 1) {
      setCurrent(current + 1);
    }
  };

  const finishInterview = async () => {
    setSubmitting(true);
    try {
      await api.post(`/interviews/${id}/complete`);
      navigate(`/interview/${id}/result`);
    } catch (err) {
      setError(err.response?.data?.message || "Could not complete interview");
    } finally {
      setSubmitting(false);
    }
  };

  if (!interview) return <p className="text-slate-400">Loading interview…</p>;

  const answeredCount = interview.questions.filter((q) => q.answeredAt).length;
  const isLast = current === interview.questions.length - 1;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
          <span>{interview.role} · {interview.seniority} · {interview.mode} mode</span>
          <span>{answeredCount}/{interview.questions.length} answered</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-800">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${(answeredCount / interview.questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="card p-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="pill bg-accent/10 capitalize text-accent-light">{question.category}</span>
          <span className="pill bg-ink-800 capitalize text-slate-400">{question.difficulty}</span>
        </div>
        <p className="text-lg font-medium text-white">{question.text}</p>
        {interview.mode === "voice" && voiceSupported && (
          <button onClick={() => speak(question.text)} className="btn-ghost mt-2 !px-0 text-xs">
            🔊 Replay question
          </button>
        )}
      </div>

      {!lastFeedback ? (
        <div className="card p-6">
          <label className="label">Your answer</label>
          <textarea
            className="input min-h-[140px] resize-y"
            placeholder={interview.mode === "voice" ? "Use the mic below, or type here…" : "Type your answer…"}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />

          {interview.mode === "voice" && voiceSupported && (
            <button
              onClick={isListening ? stopListening : startListening}
              className={`btn-secondary mt-3 ${isListening ? "border-coral text-coral" : ""}`}
            >
              {isListening ? "⏹ Stop recording" : "🎤 Start recording"}
            </button>
          )}
          {interview.mode === "voice" && !voiceSupported && (
            <p className="mt-2 text-xs text-amber">
              Your browser doesn't support speech recognition — you can still type your answer.
            </p>
          )}

          {error && <p className="mt-3 rounded-lg bg-coral/10 px-3 py-2 text-sm text-coral">{error}</p>}

          <button
            onClick={submitAnswer}
            disabled={submitting || !answer.trim()}
            className="btn-primary mt-4 w-full"
          >
            {submitting ? "Grading your answer…" : "Submit answer"}
          </button>
        </div>
      ) : (
        <div className="card space-y-4 p-6">
          <div className="flex items-center gap-4">
            <ScorePill score={lastFeedback.score} size="lg" />
            <div>
              <p className="font-semibold text-white">Answer feedback</p>
              <p className="text-xs text-slate-500">Score reflects clarity, structure, and depth</p>
            </div>
          </div>

          {lastFeedback.strengths?.length > 0 && (
            <div>
              <p className="label text-mint">Strengths</p>
              <ul className="list-inside list-disc space-y-1 text-sm text-slate-300">
                {lastFeedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
          {lastFeedback.improvements?.length > 0 && (
            <div>
              <p className="label text-amber">Areas to improve</p>
              <ul className="list-inside list-disc space-y-1 text-sm text-slate-300">
                {lastFeedback.improvements.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
          {lastFeedback.idealAnswerNotes && (
            <div>
              <p className="label">What a strong answer includes</p>
              <p className="text-sm text-slate-300">{lastFeedback.idealAnswerNotes}</p>
            </div>
          )}

          {isLast ? (
            <button onClick={finishInterview} disabled={submitting} className="btn-primary w-full">
              {submitting ? "Finalizing…" : "Finish interview & see full report"}
            </button>
          ) : (
            <button onClick={nextQuestion} className="btn-primary w-full">
              Next question →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
