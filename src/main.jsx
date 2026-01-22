import React, { useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { FileText, Upload, Save, Download, Trash2, Plus, X, Copy, FolderOpen, File, CheckCircle, AlertCircle, Loader, Edit3 } from 'lucide-react';

// Images encodées pour AluGlass
const LOGO_ALUGLASS = "data:image/webp;base64,..."; // (Garde tes chaînes Base64 ici)
const FOOTER_ALUGLASS = "data:image/webp;base64,..."; // (Garde tes chaînes Base64 ici)

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSANTS DE STRUCTURE
// ═══════════════════════════════════════════════════════════════════════════

function InputField({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div className="mb-2">
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input 
        type={type} 
        value={value} 
        onChange={onChange} 
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" 
      />
    </div>
  );
}

function TextAreaField({ label, value, onChange, placeholder, rows = 3, hint }) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-1">{hint}</p>}
      <textarea 
        value={value} 
        onChange={onChange} 
        placeholder={placeholder} 
        rows={rows}
        className="w-full px-3 py-2 border border-gray-300 rounded text-sm resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" 
      />
    </div>
  );
}

function TabButton({ id, label, active, onClick }) {
  return (
    <button 
      onClick={() => onClick(id)}
      className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${active ? 'bg-white text-teal-700 border-t border-l border-r border-gray-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
    >
      {label}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LOGIQUE IA (CLAUDE ANTHROPIC)
// ═══════════════════════════════════════════════════════════════════════════

async function reformulerAvecClaude(contexte, travaux, pointsAttention, typeOuvrage) {
  const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;
  if (!apiKey) return null;

  const prompt = `Tu es un rédacteur technique professionnel pour AluGlass... (Tes consignes complètes)`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "dangerouslyAllowBrowser": "true" 
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20240620", 
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();
    const textContent = data.content?.find(item => item.type === "text")?.text || "";
    const cleanJson = textContent.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Erreur API Claude:", error);
    return null;
  }
}

function reformulationFallback(contexte, travaux, pointsAttention, typeOuvrage) {
  // Ta logique de secours locale (Garde ton code ici)
  return { contexte: contexte || `Intervention : ${typeOuvrage}`, travaux, pointsAttention, conclusion: "Travaux terminés." };
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL (INTERFACE)
// ═══════════════════════════════════════════════════════════════════════════

function RapportChantierApp() {
  // ... (Tout le corps de ton application avec les useState et fonctions)
  return (
    <div className="min-h-screen bg-gray-100">
       {/* Ton JSX de l'interface AluGlass */}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LE DÉCLENCHEUR (C'est ce qui répare la page blanche)
// ═══════════════════════════════════════════════════════════════════════════
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<RapportChantierApp />);
}
