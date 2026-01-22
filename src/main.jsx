const LOGO_ALUGLASS = "/logo.png";
const FOOTER_ALUGLASS = "/footer.png";
// ═══════════════════════════════════════════════════════════════════════════
// COMPOSANTS REUTILISABLES
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
        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all" 
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
        className="w-full px-3 py-2 border border-gray-300 rounded text-sm resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all" 
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
// LOGIQUE IA ET REFORMULATION
// ═══════════════════════════════════════════════════════════════════════════
async function reformulerAvecClaude(contexte, travaux, pointsAttention, typeOuvrage) {
  const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;
  if (!apiKey) return null;

  const prompt = `Tu es un rédacteur technique professionnel pour AluGlass, entreprise spécialisée dans les vérandas, pergolas et carports.

TEXTE BRUT À REFORMULER :
Contexte saisi : "${contexte || 'Non précisé'}"
Travaux saisis : "${travaux}"
Points d'attention saisis : "${pointsAttention || 'Aucun'}"
Type d'ouvrage : ${typeOuvrage}

CONSIGNES DE REFORMULATION :
1. Réécris ces textes de manière PROFESSIONNELLE et STRUCTURÉE
2. Corrige les fautes d'orthographe et de grammaire
3. Utilise un ton technique et formel
4. Supprime les formulations familières
5. Organise les informations de manière logique
6. Garde TOUS les détails techniques importants
7. Signale les incidents de manière factuelle

Réponds UNIQUEMENT avec un JSON valide :
{
  "contexte": "...",
  "travaux": "...",
  "pointsAttention": "...",
  "conseilsEntretien": "...",
  "conseilsUtilisation": "...",
  "recommandations": "...",
  "conclusion": "..."
}`;

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
  return { 
    contexte: contexte || `Intervention : ${typeOuvrage}`, 
    travaux: travaux, 
    pointsAttention: pointsAttention || "RAS", 
    conseilsEntretien: "Nettoyage standard à l'eau savonneuse.",
    conseilsUtilisation: "Usage normal.",
    recommandations: "RAS",
    conclusion: "Travaux terminés."
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════
function RapportChantierApp() {
  const [rapports, setRapports] = useState([]);
  const [currentRapport, setCurrentRapport] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [activeTab, setActiveTab] = useState('client');
  const [clientName, setClientName] = useState('');
  const [adresseChantier, setAdresseChantier] = useState('');
  const [travauxRealises, setTravauxRealises] = useState('');
  const [contexte, setContexte] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  
  const generateRapport = async () => {
    if (!travauxRealises.trim()) return;
    setIsGenerating(true);
    let reformulation = await reformulerAvecClaude(contexte, travauxRealises, "", "Véranda");
    if (!reformulation) reformulation = reformulationFallback(contexte, travauxRealises, "", "Véranda");
    
    const rapport = { id: Date.now(), client: clientName, travaux: reformulation.travaux, etapes: [] };
    setCurrentRapport(rapport);
    setGeneratedContent(`RAPPORT ALUGLASS\nCLIENT: ${clientName}\n\nTRAVAUX:\n${reformulation.travaux}\n\nCONCLUSION:\n${reformulation.conclusion}`);
    setIsGenerating(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <header className="bg-white border-b-4 border-teal-500 p-4 shadow mb-6 flex justify-between items-center rounded-lg">
        <img src={LOGO_ALUGLASS} alt="AluGlass" className="h-10" />
        <h1 className="text-xl font-bold text-teal-800 hidden sm:block">Générateur de Rapport</h1>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <TabButton id="client" label="Client" active={activeTab === 'client'} onClick={setActiveTab} />
          <TabButton id="intervention" label="Travaux" active={activeTab === 'intervention'} onClick={setActiveTab} />
          
          <div className="mt-4">
            {activeTab === 'client' && (
              <>
                <InputField label="Nom du client" value={clientName} onChange={(e)=>setClientName(e.target.value)} />
                <InputField label="Adresse" value={adresseChantier} onChange={(e)=>setAdresseChantier(e.target.value)} />
              </>
            )}
            {activeTab === 'intervention' && (
              <>
                <TextAreaField label="Notes de chantier" value={travauxRealises} onChange={(e)=>setTravauxRealises(e.target.value)} rows={10} placeholder="Décrivez les travaux ici..." />
                <button onClick={generateRapport} disabled={isGenerating} className="w-full bg-teal-600 text-white py-3 rounded-lg hover:bg-teal-700 transition flex justify-center gap-2">
                  {isGenerating ? <Loader className="animate-spin" /> : <Edit3 />} Générer avec IA
                </button>
              </>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Aperçu du Rapport</h2>
          {generatedContent ? (
            <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded border h-96 overflow-auto">{generatedContent}</pre>
          ) : (
            <div className="h-96 flex items-center justify-center text-gray-400 italic">Remplissez les infos pour générer le rapport.</div>
          )}
        </div>
      </main>
      
      <footer className="mt-8 text-center">
        <img src={FOOTER_ALUGLASS} alt="Footer" className="max-w-xl mx-auto opacity-50" />
      </footer>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// IGNITION (LE DÉCLENCHEUR INDISPENSABLE)
// ═══════════════════════════════════════════════════════════════════════════
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<RapportChantierApp />);
}
