import React, { useState, useRef } from 'react';
import { FileText, Upload, Save, Download, Trash2, Plus, X, Copy, FolderOpen, File, CheckCircle, AlertCircle, Loader, Edit3 } from 'lucide-react';

const LOGO_ALUGLASS = "/logo.png";
const FOOTER_ALUGLASS = "/footer.png";
// ═══════════════════════════════════════════════════════════════════════════
// COMPOSANTS EXTERNES (évite la perte de focus lors de la saisie)
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
// FONCTION DE REFORMULATION VIA API CLAUDE
// ═══════════════════════════════════════════════════════════════════════════

async function reformulerAvecClaude(contexte, travaux, pointsAttention, typeOuvrage) {
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
4. Supprime les formulations familières ("Bonjour", "??", remarques personnelles)
5. Organise les informations de manière logique
6. Garde TOUS les détails techniques importants (dimensions, nombres, types d'éléments)
7. Signale les incidents ou problèmes de manière factuelle et professionnelle

GÉNÈRE ÉGALEMENT :
- Des conseils d'entretien adaptés à cet ouvrage spécifique
- Des conseils d'utilisation basés sur les éléments installés
- Des recommandations particulières si des problèmes ont été signalés
- Une conclusion professionnelle

Réponds UNIQUEMENT avec un JSON valide (sans markdown, sans backticks) au format :
{
  "contexte": "texte reformulé du contexte",
  "travaux": "texte reformulé des travaux réalisés",
  "pointsAttention": "texte reformulé des points d'attention",
  "conseilsEntretien": "conseils d'entretien générés",
  "conseilsUtilisation": "conseils d'utilisation générés",
  "recommandations": "recommandations particulières générées",
  "conclusion": "conclusion professionnelle générée"
}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
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
  const cleanText = (text) => {
    if (!text) return '';
    return text.replace(/^bonjour\s*/gi, '').replace(/\?\?+/g, '').replace(/\s+/g, ' ').trim();
  };

  const travauxClean = cleanText(travaux);
  const contexteClean = cleanText(contexte) || `Intervention de pose : ${typeOuvrage}.`;
  const pointsClean = cleanText(pointsAttention);

  let entretien, utilisation, recommandations;
  const typeLower = typeOuvrage.toLowerCase();

  if (typeLower.includes('véranda') || typeLower.includes('veranda') || typeLower.includes('cosy')) {
    entretien = "Nettoyer régulièrement les vitrages avec un produit neutre non abrasif et une raclette. Vérifier et nettoyer les rails de coulissants tous les 3 mois pour assurer un fonctionnement optimal. Contrôler l'écoulement des eaux de pluie dans les chéneaux au moins deux fois par an.";
    utilisation = "Manipuler les ouvrants coulissants en douceur, sans forcer sur les poignées. En cas de résistance, vérifier la propreté des rails avant toute manipulation.";
    recommandations = "Faire réaliser un contrôle annuel par un professionnel pour vérifier l'étanchéité et les réglages.";
  } else if (typeLower.includes('pergola')) {
    entretien = "Nettoyer la structure aluminium avec de l'eau savonneuse et une éponge douce. Vérifier le bon fonctionnement des lames orientables ou de la toile selon la saison.";
    utilisation = "Orienter les lames selon l'ensoleillement souhaité. En cas de pluie, fermer complètement les lames.";
    recommandations = "Prévoir une inspection des joints et fixations avant chaque saison estivale.";
  } else if (typeLower.includes('carport')) {
    entretien = "Nettoyer la structure avec de l'eau claire et un détergent doux. Vérifier l'état de la couverture et des gouttières deux fois par an.";
    utilisation = "Ne pas surcharger la structure avec des éléments non prévus lors de la conception.";
    recommandations = "En cas de neige abondante, déneiger la toiture pour éviter toute surcharge.";
  } else {
    entretien = "Nettoyer régulièrement la structure avec de l'eau savonneuse et une éponge douce. Vérifier l'état général de l'ouvrage au moins deux fois par an.";
    utilisation = "Utiliser l'ouvrage conformément à sa conception initiale. En cas de dysfonctionnement, contacter le SAV.";
    recommandations = "Faire réaliser un contrôle annuel par un professionnel pour garantir la pérennité de l'installation.";
  }

  const conclusion = `L'intervention s'est déroulée conformément aux attentes. L'ouvrage ${typeOuvrage} est désormais opérationnel et prêt à l'usage. Le client a été informé des consignes d'entretien et d'utilisation. Pour toute question ou intervention ultérieure, notre service SAV reste à disposition.`;

  return { contexte: contexteClean, travaux: travauxClean, pointsAttention: pointsClean, conseilsEntretien: entretien, conseilsUtilisation: utilisation, recommandations, conclusion };
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function RapportChantierApp() {
  const [rapports, setRapports] = useState([]);
  const [currentRapport, setCurrentRapport] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [typeOuvrage, setTypeOuvrage] = useState('veranda');
  const [typeOuvrageCustom, setTypeOuvrageCustom] = useState('');
  const [clientName, setClientName] = useState('');
  const [dateChantier, setDateChantier] = useState(new Date().toISOString().split('T')[0]);
  const [adresseChantier, setAdresseChantier] = useState('');
  const [cpVille, setCpVille] = useState('');
  const [clientPro, setClientPro] = useState('');
  const [adressePro, setAdressePro] = useState('');
  const [cpVillePro, setCpVillePro] = useState('');
  const [telPro, setTelPro] = useState('');
  const [emailPro, setEmailPro] = useState('');
  const [numClient, setNumClient] = useState('');
  const [numDossier, setNumDossier] = useState('');
  const [technicien, setTechnicien] = useState('M. Régis ORRYE');
  const [fonctionTech, setFonctionTech] = useState('Technicien SAV');
  const [telTech, setTelTech] = useState('07.56.43.63.48');
  const [emailTech, setEmailTech] = useState('r.orrye@alu-glass.com');
  const [assistante, setAssistante] = useState('Mme. Prescillia RIGAUT');
  const [fonctionAss, setFonctionAss] = useState('Assistante Commerciale');
  const [telAss, setTelAss] = useState('02.33.89.19.45');
  const [emailAss, setEmailAss] = useState('p.rigaut@alu-glass.com');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [contexte, setContexte] = useState('');
  const [travauxRealises, setTravauxRealises] = useState('');
  const [pointsAttention, setPointsAttention] = useState('');
  const [notification, setNotification] = useState(null);
  const [showRapportsList, setShowRapportsList] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [showPDFInstructions, setShowPDFInstructions] = useState(false);
  const [activeTab, setActiveTab] = useState('client');
  const fileInputRef = useRef(null);
  const importInputRef = useRef(null);

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotos(prev => [...prev, { id: Date.now() + Math.random(), name: file.name, data: event.target.result, description: '' }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (id) => setPhotos(prev => prev.filter(p => p.id !== id));
  const updatePhotoDescription = (id, description) => setPhotos(prev => prev.map(p => p.id === id ? { ...p, description } : p));

  const ouvrageLabels = { veranda: 'Véranda COSY', pergola: 'Pergola', carport: 'Carport', autre: 'Autre' };
  
  const getTypeOuvrageLabel = () => {
    if (typeOuvrage === 'autre' && typeOuvrageCustom.trim()) {
      return typeOuvrageCustom.trim();
    }
    return ouvrageLabels[typeOuvrage] || typeOuvrage;
  };

  const analyzeAndGenerateSteps = (type, travaux) => {
    const travauxLower = (travaux || '').toLowerCase();
    const typeLower = type.toLowerCase();
    let steps = [];
    let stepNum = 1;

    steps.push({ num: stepNum++, titre: 'Contrôle de la surface de pose et préparation', detail: 'Prise de mesures, vérification de la planéité, organisation du chantier, déballage et contrôle du matériel livré.' });

    if (typeLower.includes('véranda') || typeLower.includes('veranda') || typeLower.includes('cosy')) {
      if (travauxLower.includes('châssis') || travauxLower.includes('chassis') || travauxLower.includes('assemblage') || !travaux) {
        steps.push({ num: stepNum++, titre: 'Assemblage des châssis et étanchéité', detail: 'Prévoir une cale de 5 mm sous châssis pour l\'effet pont thermique et réservation pour bavette.' });
      }
      if (travauxLower.includes('chéneau') || travauxLower.includes('cheneau') || travauxLower.includes('gouttière') || !travaux) {
        steps.push({ num: stepNum++, titre: 'Pose du chéneau', detail: 'Ponçage de la paroi interne, pose sur châssis et vérification de l\'étanchéité.' });
      }
      if (travauxLower.includes('faitage') || travauxLower.includes('faîtage') || travauxLower.includes('toiture') || travauxLower.includes('chevron') || !travaux) {
        steps.push({ num: stepNum++, titre: 'Assemblage du faitage et mise en place toiture', detail: 'Contrôle de l\'étanchéité et alignement de la structure.' });
      }
      if (travauxLower.includes('spot') || travauxLower.includes('éclairage') || travauxLower.includes('eclairage') || travauxLower.includes('électri')) {
        steps.push({ num: stepNum++, titre: 'Installation électrique', detail: 'Préparation des spots d\'éclairage dans les chevrons selon plan électrique.' });
      }
      if (travauxLower.includes('vitrage') || travauxLower.includes('vitre') || travauxLower.includes('coulissant') || !travaux) {
        steps.push({ num: stepNum++, titre: 'Mise en place des vitrages et coulissants', detail: 'Installation, calage du seuil et réglage des ouvrants.' });
      }
      if (travauxLower.includes('bavette') || travauxLower.includes('étanchéité') || !travaux) {
        steps.push({ num: stepNum++, titre: 'Étanchéité et bavette', detail: 'Mise en place de la bavette et traitement de l\'étanchéité intérieure.' });
      }
    } else if (typeLower.includes('pergola')) {
      steps.push({ num: stepNum++, titre: 'Installation des poteaux', detail: 'Mise en place des poteaux et fixations au sol selon plan d\'implantation.' });
      steps.push({ num: stepNum++, titre: 'Assemblage de la structure', detail: 'Montage de la structure principale, traverses et renforts.' });
      steps.push({ num: stepNum++, titre: 'Installation du système de couverture', detail: 'Pose des lames orientables ou de la toile selon le modèle.' });
    } else if (typeLower.includes('carport')) {
      steps.push({ num: stepNum++, titre: 'Mise en place des poteaux', detail: 'Installation des poteaux et ancrages au sol.' });
      steps.push({ num: stepNum++, titre: 'Assemblage de la structure portante', detail: 'Pose des pannes, chevrons et structure de couverture.' });
      steps.push({ num: stepNum++, titre: 'Installation de la couverture', detail: 'Pose des panneaux de couverture et vérification de l\'étanchéité.' });
    } else {
      steps.push({ num: stepNum++, titre: 'Installation de la structure principale', detail: 'Mise en place et fixation des éléments structurels.' });
      steps.push({ num: stepNum++, titre: 'Assemblage et montage', detail: 'Assemblage des différents composants selon les spécifications techniques.' });
      steps.push({ num: stepNum++, titre: 'Vérifications techniques', detail: 'Contrôle de l\'alignement, de la stabilité et de l\'étanchéité.' });
    }

    steps.push({ num: stepNum++, titre: 'Finitions et nettoyage', detail: 'Pose des joints, nettoyage complet du chantier et vérification finale.' });

    return steps;
  };

  const generateRapport = async () => {
    if (!travauxRealises.trim()) {
      showNotification('Veuillez décrire les travaux réalisés', 'error');
      return;
    }
    setIsGenerating(true);
    setIsEditingContent(false);
    showNotification('Reformulation en cours avec Claude...', 'success');
    
    const typeOuvrageLabel = getTypeOuvrageLabel();
    
    let reformulation = await reformulerAvecClaude(contexte, travauxRealises, pointsAttention, typeOuvrageLabel);
    
    if (!reformulation) {
      showNotification('API indisponible, utilisation du mode local', 'error');
      reformulation = reformulationFallback(contexte, travauxRealises, pointsAttention, typeOuvrageLabel);
    }
    
    const etapes = analyzeAndGenerateSteps(typeOuvrageLabel, travauxRealises);
    
    const rapport = {
      id: Date.now(),
      date: new Date().toISOString(),
      dateChantier, dateDebut, dateFin,
      client: clientName || 'Non spécifié',
      adresse: adresseChantier || 'Non spécifiée',
      cpVille: cpVille || '',
      clientPro, adressePro, cpVillePro, telPro, emailPro,
      numClient, numDossier,
      technicien, fonctionTech, telTech, emailTech,
      assistante, fonctionAss, telAss, emailAss,
      typeOuvrage: typeOuvrageLabel,
      contexte: reformulation.contexte,
      travauxRealises: reformulation.travaux,
      pointsAttention: reformulation.pointsAttention,
      conseilsEntretien: reformulation.conseilsEntretien,
      conseilsUtilisation: reformulation.conseilsUtilisation,
      recommandations: reformulation.recommandations,
      conclusion: reformulation.conclusion,
      etapes,
      photos: photos.map((p, index) => ({ num: index + 1, name: p.name, data: p.data, description: p.description })),
      contenu: ''
    };
    
    const content = generateTextContent(rapport);
    rapport.contenu = content;
    setGeneratedContent(content);
    setCurrentRapport(rapport);
    setIsGenerating(false);
    showNotification('Rapport généré ! Vous pouvez le modifier si besoin.', 'success');
  };

  const generateTextContent = (rapport) => {
    const dateIntervention = rapport.dateDebut && rapport.dateFin 
      ? `${rapport.dateDebut} au ${rapport.dateFin}` 
      : rapport.dateChantier;

    const etapesText = rapport.etapes.map(e => 
      `  Étape ${e.num} : ${e.titre}\n           ${e.detail}`
    ).join('\n\n');

    let interventionText = '';
    if (rapport.contexte) interventionText += `CONTEXTE :\n${rapport.contexte}\n\n`;
    if (rapport.travauxRealises) interventionText += `TRAVAUX RÉALISÉS :\n${rapport.travauxRealises}\n\n`;
    if (rapport.pointsAttention) interventionText += `POINTS D'ATTENTION :\n${rapport.pointsAttention}\n\n`;

    let conseilsText = '';
    if (rapport.conseilsEntretien) conseilsText += `ENTRETIEN :\n${rapport.conseilsEntretien}\n\n`;
    if (rapport.conseilsUtilisation) conseilsText += `UTILISATION :\n${rapport.conseilsUtilisation}\n\n`;
    if (rapport.recommandations) conseilsText += `RECOMMANDATIONS :\n${rapport.recommandations}\n\n`;

    return `══════════════════════════════════════════════════════════════════════════
                    COMPTE RENDU D'ASSISTANCE DE POSE
══════════════════════════════════════════════════════════════════════════

ALUGLASS SAS | 44 Avenue de la PIERRE VALLEE | PA DE L'ESTUAIRE | BP 220 | 50220 POILLEY

──────────────────────────────────────────────────────────────────────────
                         INFORMATIONS CLIENT
──────────────────────────────────────────────────────────────────────────

CLIENT PROFESSIONNEL :                    CLIENT PARTICULIER :
${rapport.clientPro || '-'}               ${rapport.client}
${rapport.adressePro || '-'}              ${rapport.adresse}
${rapport.cpVillePro || '-'}              ${rapport.cpVille || '-'}
Tel : ${rapport.telPro || '-'}
E-mail : ${rapport.emailPro || '-'}

Numéro Client : ${rapport.numClient || '-'}    Numéro Dossier : ${rapport.numDossier || '-'}

──────────────────────────────────────────────────────────────────────────
                         COORDONNÉES INTERVENANTS
──────────────────────────────────────────────────────────────────────────

TECHNICIEN :                              ASSISTANTE :
${rapport.technicien}                     ${rapport.assistante}
${rapport.fonctionTech}                   ${rapport.fonctionAss}
Tel : ${rapport.telTech}                  Tel : ${rapport.telAss}
${rapport.emailTech}                      ${rapport.emailAss}

──────────────────────────────────────────────────────────────────────────
Date d'intervention : ${dateIntervention}
Type d'ouvrage : ${rapport.typeOuvrage}
──────────────────────────────────────────────────────────────────────────

                         DESCRIPTION DE L'INTERVENTION
──────────────────────────────────────────────────────────────────────────

${interventionText}
──────────────────────────────────────────────────────────────────────────
                    ÉTAPES D'ASSISTANCE DE POSE RÉALISÉES
──────────────────────────────────────────────────────────────────────────

${etapesText}

──────────────────────────────────────────────────────────────────────────
                         CONSEILS ET RECOMMANDATIONS
──────────────────────────────────────────────────────────────────────────

${conseilsText}CONCLUSION :
${rapport.conclusion}

══════════════════════════════════════════════════════════════════════════
ALUGLASS SAS | Siret : 409 441 300 000 20 | TVA : FR 1140 944 13 00
Tel : 02 33 58 12 12 | contact@alu-glass.com | www.alu-glass.com
══════════════════════════════════════════════════════════════════════════`;
  };

  const generateHTMLDocument = () => {
    if (!currentRapport) return '';
    const dateIntervention = currentRapport.dateDebut && currentRapport.dateFin 
      ? `${currentRapport.dateDebut} au ${currentRapport.dateFin}`
      : new Date(currentRapport.dateChantier).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const photosHTML = currentRapport.photos.length > 0 
      ? currentRapport.photos.map((p) => `
        <div style="page-break-inside: avoid; margin: 10px 0; border: 1px solid #ddd; border-radius: 4px; overflow: hidden;">
          <img src="${p.data}" style="width: 100%; max-height: 200px; object-fit: contain; background: #f9f9f9;" />
          <div style="padding: 6px 10px; background: #f5f5f5; border-top: 1px solid #ddd; font-size: 10px;">
            <strong>Photo ${p.num}</strong>${p.description ? ` - ${p.description}` : ''}
          </div>
        </div>`).join('') : '';

    const etapesHTML = currentRapport.etapes.map(e => `
      <div style="display: flex; align-items: flex-start; margin: 6px 0; padding: 6px 0; border-bottom: 1px solid #f0f0f0;">
        <div style="min-width: 60px; font-weight: bold; color: #3db9a4; font-size: 9pt;">Étape ${e.num}</div>
        <div style="flex: 1; font-size: 9pt;">
          <span style="color: #3db9a4; margin-right: 4px;">➜</span><strong>${e.titre}</strong>
          <div style="color: #666; font-size: 8pt; margin-top: 2px; margin-left: 14px;">${e.detail}</div>
        </div>
      </div>`).join('');

    let interventionHTML = '';
    if (currentRapport.contexte) {
      interventionHTML += `<div style="margin-bottom: 12px;"><strong style="color: #3db9a4; font-size: 10pt;">📋 Contexte :</strong><p style="margin: 6px 0 0 0; font-size: 9pt; line-height: 1.5;">${currentRapport.contexte}</p></div>`;
    }
    if (currentRapport.travauxRealises) {
      interventionHTML += `<div style="margin-bottom: 12px;"><strong style="color: #3db9a4; font-size: 10pt;">🔧 Travaux réalisés :</strong><p style="margin: 6px 0 0 0; font-size: 9pt; line-height: 1.5;">${currentRapport.travauxRealises}</p></div>`;
    }
    if (currentRapport.pointsAttention) {
      interventionHTML += `<div style="margin-bottom: 12px;"><strong style="color: #d4a574; font-size: 10pt;">⚠️ Points d'attention :</strong><p style="margin: 6px 0 0 0; font-size: 9pt; line-height: 1.5;">${currentRapport.pointsAttention}</p></div>`;
    }

    let conseilsHTML = '';
    if (currentRapport.conseilsEntretien) {
      conseilsHTML += `<div style="margin-bottom: 12px;"><strong style="color: #3db9a4; font-size: 10pt;">🧹 Entretien :</strong><p style="margin: 6px 0 0 0; font-size: 9pt; line-height: 1.5;">${currentRapport.conseilsEntretien}</p></div>`;
    }
    if (currentRapport.conseilsUtilisation) {
      conseilsHTML += `<div style="margin-bottom: 12px;"><strong style="color: #3db9a4; font-size: 10pt;">📖 Utilisation :</strong><p style="margin: 6px 0 0 0; font-size: 9pt; line-height: 1.5;">${currentRapport.conseilsUtilisation}</p></div>`;
    }
    if (currentRapport.recommandations) {
      conseilsHTML += `<div style="margin-bottom: 12px;"><strong style="color: #d4a574; font-size: 10pt;">💡 Recommandations :</strong><p style="margin: 6px 0 0 0; font-size: 9pt; line-height: 1.5;">${currentRapport.recommandations}</p></div>`;
    }
    if (currentRapport.conclusion) {
      conseilsHTML += `<div style="margin-top: 15px; padding: 12px; background: #e8f5f3; border-radius: 6px; border-left: 4px solid #3db9a4;"><strong style="color: #2d8b7a; font-size: 10pt;">✅ Conclusion :</strong><p style="margin: 6px 0 0 0; font-size: 9pt; line-height: 1.5;">${currentRapport.conclusion}</p></div>`;
    }

    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Compte Rendu - ${currentRapport.client}</title>
  <style>
    @page { margin: 10mm 15mm; size: A4; }
    @media print { 
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } 
      .page { padding: 0; }
      .page-break { page-break-before: always; }
      .no-print { display: none !important; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 9pt; line-height: 1.4; color: #333; background: #fff; }
    .page { max-width: 210mm; margin: 0 auto; padding: 15px 25px; position: relative; }
    .page-break { page-break-before: always; }
    .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; border-bottom: 3px solid #3db9a4; margin-bottom: 18px; }
    .header-simple { padding-bottom: 12px; border-bottom: 3px solid #3db9a4; margin-bottom: 18px; text-align: center; color: #3db9a4; font-weight: 600; font-size: 10pt; }
    .logo-img { height: 55px; width: auto; }
    .company-info { text-align: right; font-size: 8pt; color: #555; line-height: 1.5; }
    .main-title { text-align: center; margin: 15px 0; padding: 12px 18px; border: 2px solid #3db9a4; border-radius: 4px; }
    .main-title h1 { color: #3db9a4; font-size: 13pt; font-weight: 600; letter-spacing: 0.5px; margin: 0; }
    .section { margin: 12px 0; }
    .section-title { font-weight: 600; color: #3db9a4; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #e0e0e0; font-size: 10pt; }
    .two-col { display: flex; gap: 15px; flex-wrap: wrap; }
    .col { flex: 1; min-width: 200px; }
    .col-box { background: #fafafa; padding: 10px; border-radius: 4px; border: 1px solid #e8e8e8; height: 100%; }
    .info-row { display: flex; margin: 4px 0; font-size: 8.5pt; }
    .info-label { min-width: 55px; font-weight: 600; color: #333; }
    .info-value { color: #444; flex: 1; }
    .numbers-row { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin: 10px 0; padding: 8px 0; border-top: 1px solid #e8e8e8; font-size: 8.5pt; }
    .highlight { margin: 10px 0; font-size: 9pt; padding: 8px 12px; background: #f8f8f8; border-left: 4px solid #3db9a4; border-radius: 0 4px 4px 0; }
    .description { background: #fafafa; padding: 12px; border-radius: 4px; border: 1px solid #e8e8e8; }
    .footer-img { width: 100%; height: auto; margin-top: 20px; }
    .print-btn { position: fixed; top: 20px; right: 20px; background: linear-gradient(135deg, #10b981, #3b82f6); color: white; border: none; padding: 15px 30px; border-radius: 10px; cursor: pointer; font-size: 16px; font-weight: 700; box-shadow: 0 4px 15px rgba(0,0,0,0.3); z-index: 1000; transition: transform 0.2s; }
    .print-btn:hover { transform: scale(1.05); background: linear-gradient(135deg, #059669, #2563eb); }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">🖨️ Imprimer / Sauvegarder PDF</button>

  <!-- PAGE 1 : Informations client + Intervention -->
  <div class="page">
    <div class="header">
      <img src="${LOGO_ALUGLASS}" alt="AluGlass" class="logo-img" />
      <div class="company-info">44 Avenue de la PIERRE VALLEE<br>PA DE L'ESTUAIRE | BP 220<br>50220 POILLEY</div>
    </div>
    <div class="main-title"><h1>COMPTE RENDU D'ASSISTANCE DE POSE</h1></div>
    <div class="section">
      <div class="two-col">
        <div class="col"><div class="col-box"><div class="section-title">Client Professionnel</div>
          <div class="info-row"><span class="info-label">Nom :</span><span class="info-value">${currentRapport.clientPro || '-'}</span></div>
          <div class="info-row"><span class="info-label">Adresse :</span><span class="info-value">${currentRapport.adressePro || '-'}</span></div>
          <div class="info-row"><span class="info-label">CP-Ville :</span><span class="info-value">${currentRapport.cpVillePro || '-'}</span></div>
          <div class="info-row"><span class="info-label">Tel :</span><span class="info-value">${currentRapport.telPro || '-'}</span></div>
          <div class="info-row"><span class="info-label">E-mail :</span><span class="info-value">${currentRapport.emailPro || '-'}</span></div>
        </div></div>
        <div class="col"><div class="col-box"><div class="section-title">Client Particulier</div>
          <div class="info-row"><span class="info-value"><strong>${currentRapport.client}</strong></span></div>
          <div class="info-row"><span class="info-value">${currentRapport.adresse}</span></div>
          <div class="info-row"><span class="info-value">${currentRapport.cpVille || '-'}</span></div>
        </div></div>
      </div>
    </div>
    <div class="numbers-row">
      <div><strong>N° Client :</strong> ${currentRapport.numClient || '-'}</div>
      <div><strong>N° Dossier AluGlass :</strong> ${currentRapport.numDossier || '-'}</div>
    </div>
    <div class="section">
      <div class="two-col">
        <div class="col"><div class="col-box"><div class="section-title">Technicien</div>
          <div class="info-row"><span class="info-value"><strong>${currentRapport.technicien}</strong></span></div>
          <div class="info-row"><span class="info-value">${currentRapport.fonctionTech}</span></div>
          <div class="info-row"><span class="info-label">Tel :</span><span class="info-value">${currentRapport.telTech}</span></div>
          <div class="info-row"><span class="info-value">${currentRapport.emailTech}</span></div>
        </div></div>
        <div class="col"><div class="col-box"><div class="section-title">Assistante</div>
          <div class="info-row"><span class="info-value"><strong>${currentRapport.assistante}</strong></span></div>
          <div class="info-row"><span class="info-value">${currentRapport.fonctionAss}</span></div>
          <div class="info-row"><span class="info-label">Tel :</span><span class="info-value">${currentRapport.telAss}</span></div>
          <div class="info-row"><span class="info-value">${currentRapport.emailAss}</span></div>
        </div></div>
      </div>
    </div>
    <div class="highlight"><strong>📅 Date d'intervention :</strong> ${dateIntervention}<br><strong>🏠 Type d'ouvrage :</strong> ${currentRapport.typeOuvrage}</div>
    <div class="section"><div class="section-title">Description de l'intervention</div><div class="description">${interventionHTML || '<p style="color: #999; font-style: italic;">Aucune description fournie.</p>'}</div></div>
  </div>

  <!-- PAGE 2 : Étapes + Photos -->
  <div class="page page-break">
    <div class="header-simple">COMPTE RENDU D'ASSISTANCE DE POSE - ${currentRapport.client}</div>
    <div class="main-title"><h1>ÉTAPES D'ASSISTANCE DE POSE - ${currentRapport.typeOuvrage.toUpperCase()}</h1></div>
    <div class="section"><div class="description">${etapesHTML}</div></div>
    ${currentRapport.photos.length > 0 ? `<div class="section" style="margin-top: 18px;"><div class="section-title">Photos de l'intervention</div><div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px;">${photosHTML}</div></div>` : ''}
  </div>

  <!-- PAGE 3 : Conseils et Conclusion -->
  <div class="page page-break">
    <div class="header-simple">COMPTE RENDU D'ASSISTANCE DE POSE - ${currentRapport.client}</div>
    <div class="main-title"><h1>CONSEILS ET RECOMMANDATIONS</h1></div>
    <div class="section"><div class="description">${conseilsHTML}</div></div>
    <img src="${FOOTER_ALUGLASS}" alt="AluGlass Footer" class="footer-img" />
  </div>
</body>
</html>`;
  };

  const saveToList = () => {
    if (!currentRapport) return;
    const updatedRapport = { ...currentRapport, contenu: generatedContent };
    const existingIndex = rapports.findIndex(r => r.id === updatedRapport.id);
    let newRapports = existingIndex >= 0 
      ? rapports.map((r, i) => i === existingIndex ? updatedRapport : r)
      : [...rapports, updatedRapport];
    setRapports(newRapports);
    setCurrentRapport(updatedRapport);
    showNotification('Rapport sauvegardé', 'success');
  };

  const deleteRapport = (id) => {
    setRapports(rapports.filter(r => r.id !== id));
    if (currentRapport?.id === id) { setCurrentRapport(null); setGeneratedContent(''); }
    showNotification('Rapport supprimé', 'success');
  };

  const loadRapport = (rapport) => {
    setCurrentRapport(rapport);
    setGeneratedContent(rapport.contenu);
    setShowRapportsList(false);
    setIsEditingContent(false);
  };

  const downloadHTMLForPDF = () => {
    if (!currentRapport) return;
    const html = generateHTMLDocument();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CR_${currentRapport.client.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowPDFInstructions(true);
  };

  const importRapports = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.rapports && Array.isArray(data.rapports)) {
          setRapports(prev => [...prev, ...data.rapports]);
          showNotification(`${data.rapports.length} rapport(s) importé(s)`, 'success');
        } else if (data.id && data.contenu) {
          setRapports(prev => [...prev, data]);
          setCurrentRapport(data);
          setGeneratedContent(data.contenu);
          showNotification('Rapport importé', 'success');
        }
      } catch { showNotification('Erreur de lecture', 'error'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const copyToClipboard = async () => {
    if (!generatedContent) return;
    try { await navigator.clipboard.writeText(generatedContent); showNotification('Copié', 'success'); }
    catch { showNotification('Erreur de copie', 'error'); }
  };

  const resetForm = () => {
    setPhotos([]); setClientName(''); setAdresseChantier(''); setCpVille('');
    setClientPro(''); setAdressePro(''); setCpVillePro(''); setTelPro(''); setEmailPro('');
    setNumClient(''); setNumDossier(''); setDateDebut(''); setDateFin('');
    setContexte(''); setTravauxRealises(''); setPointsAttention('');
    setDateChantier(new Date().toISOString().split('T')[0]);
    setTypeOuvrage('veranda'); setTypeOuvrageCustom('');
    setCurrentRapport(null); setGeneratedContent(''); setIsEditingContent(false);
    setShowPDFInstructions(false);
  };

  const handleContentChange = (e) => {
    setGeneratedContent(e.target.value);
    if (currentRapport) {
      setCurrentRapport({ ...currentRapport, contenu: e.target.value });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 max-w-sm ${notification.type === 'success' ? 'bg-teal-500 text-white' : 'bg-red-500 text-white'}`}>
          {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm">{notification.message}</span>
        </div>
      )}

      <header className="bg-white border-b-4 border-teal-500 py-3 px-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <img src={LOGO_ALUGLASS} alt="AluGlass" className="h-10 sm:h-12" />
          <div className="flex gap-2 flex-wrap justify-center">
            <button onClick={() => setShowRapportsList(!showRapportsList)} className="bg-teal-500 hover:bg-teal-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-xs sm:text-sm">
              <Save size={14} /> <span className="hidden sm:inline">Rapports</span> ({rapports.length})
            </button>
            <button onClick={() => importInputRef.current?.click()} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-lg flex items-center gap-2 text-xs sm:text-sm">
              <FolderOpen size={14} /> <span className="hidden sm:inline">Importer</span>
            </button>
            <input ref={importInputRef} type="file" accept=".json" onChange={importRapports} className="hidden" />
            <button onClick={resetForm} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-lg flex items-center gap-2 text-xs sm:text-sm">
              <Plus size={14} /> <span className="hidden sm:inline">Nouveau</span>
            </button>
          </div>
        </div>
      </header>

      {showRapportsList && rapports.length > 0 && (
        <div className="max-w-7xl mx-auto mt-3 px-4">
          <div className="bg-white rounded-lg shadow p-3">
            <h3 className="font-semibold text-gray-700 text-sm mb-2">Rapports sauvegardés</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {rapports.map(r => (
                <div key={r.id} className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100">
                  <div className="cursor-pointer flex-1" onClick={() => loadRapport(r)}>
                    <p className="font-medium text-gray-800 text-sm">{r.client} - {r.typeOuvrage}</p>
                    <p className="text-xs text-gray-500">{new Date(r.date).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <button onClick={() => deleteRapport(r.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-5 gap-4 mt-2">
        <section className="lg:col-span-3 space-y-3">
          <div className="bg-white rounded-lg shadow">
            <div className="flex gap-1 px-3 pt-3 overflow-x-auto">
              <TabButton id="client" label="Client" active={activeTab === 'client'} onClick={setActiveTab} />
              <TabButton id="intervenants" label="Équipe" active={activeTab === 'intervenants'} onClick={setActiveTab} />
              <TabButton id="intervention" label="Intervention" active={activeTab === 'intervention'} onClick={setActiveTab} />
              <TabButton id="photos" label="Photos" active={activeTab === 'photos'} onClick={setActiveTab} />
            </div>

            <div className="p-3 sm:p-4 border-t border-gray-200">
              {activeTab === 'client' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <h3 className="text-sm font-semibold text-teal-600 mb-3 pb-2 border-b border-teal-200">Client Professionnel</h3>
                      <InputField label="Entreprise" value={clientPro} onChange={(e) => setClientPro(e.target.value)} placeholder="Nom entreprise" />
                      <InputField label="Adresse" value={adressePro} onChange={(e) => setAdressePro(e.target.value)} placeholder="Adresse" />
                      <InputField label="CP - Ville" value={cpVillePro} onChange={(e) => setCpVillePro(e.target.value)} placeholder="Code postal - Ville" />
                      <InputField label="Téléphone" value={telPro} onChange={(e) => setTelPro(e.target.value)} placeholder="Téléphone" />
                      <InputField label="Email" value={emailPro} onChange={(e) => setEmailPro(e.target.value)} placeholder="Email" type="email" />
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <h3 className="text-sm font-semibold text-teal-600 mb-3 pb-2 border-b border-teal-200">Client Particulier</h3>
                      <InputField label="Nom *" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Nom du client" />
                      <InputField label="Adresse chantier" value={adresseChantier} onChange={(e) => setAdresseChantier(e.target.value)} placeholder="Adresse du chantier" />
                      <InputField label="CP - Ville" value={cpVille} onChange={(e) => setCpVille(e.target.value)} placeholder="Code postal - Ville" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="N° Client" value={numClient} onChange={(e) => setNumClient(e.target.value)} placeholder="Numéro client" />
                    <InputField label="N° Dossier AluGlass" value={numDossier} onChange={(e) => setNumDossier(e.target.value)} placeholder="Numéro dossier" />
                  </div>
                </div>
              )}

              {activeTab === 'intervenants' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="text-sm font-semibold text-teal-600 mb-3 pb-2 border-b border-teal-200">Technicien</h3>
                    <InputField label="Nom" value={technicien} onChange={(e) => setTechnicien(e.target.value)} placeholder="Nom" />
                    <InputField label="Fonction" value={fonctionTech} onChange={(e) => setFonctionTech(e.target.value)} placeholder="Fonction" />
                    <InputField label="Téléphone" value={telTech} onChange={(e) => setTelTech(e.target.value)} placeholder="Téléphone" />
                    <InputField label="Email" value={emailTech} onChange={(e) => setEmailTech(e.target.value)} placeholder="Email" type="email" />
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="text-sm font-semibold text-teal-600 mb-3 pb-2 border-b border-teal-200">Assistante</h3>
                    <InputField label="Nom" value={assistante} onChange={(e) => setAssistante(e.target.value)} placeholder="Nom" />
                    <InputField label="Fonction" value={fonctionAss} onChange={(e) => setFonctionAss(e.target.value)} placeholder="Fonction" />
                    <InputField label="Téléphone" value={telAss} onChange={(e) => setTelAss(e.target.value)} placeholder="Téléphone" />
                    <InputField label="Email" value={emailAss} onChange={(e) => setEmailAss(e.target.value)} placeholder="Email" type="email" />
                  </div>
                </div>
              )}

              {activeTab === 'intervention' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Type d'ouvrage</label>
                      <select value={typeOuvrage} onChange={(e) => setTypeOuvrage(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-teal-500">
                        <option value="veranda">Véranda COSY</option>
                        <option value="pergola">Pergola</option>
                        <option value="carport">Carport</option>
                        <option value="autre">Autre (personnalisé)</option>
                      </select>
                      {typeOuvrage === 'autre' && (
                        <input 
                          type="text" 
                          value={typeOuvrageCustom} 
                          onChange={(e) => setTypeOuvrageCustom(e.target.value)}
                          placeholder="Ex: Store banne, Marquise, Abri..."
                          className="w-full mt-2 px-3 py-2 border border-teal-300 rounded text-sm focus:ring-2 focus:ring-teal-500 bg-teal-50"
                        />
                      )}
                    </div>
                    <InputField label="Date début" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} placeholder="Lundi 05 Janvier 2026" />
                    <InputField label="Date fin" value={dateFin} onChange={(e) => setDateFin(e.target.value)} placeholder="Jeudi 08 Janvier 2026" />
                  </div>
                  
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-semibold text-blue-700 mb-2">📋 Description de l'intervention</h4>
                    <div className="bg-white/70 p-2 rounded mb-3 border border-blue-100">
                      <p className="text-xs text-blue-700">
                        <strong>🤖 Reformulation automatique par IA :</strong> Écrivez simplement vos notes brutes, Claude les reformulera de manière professionnelle !
                      </p>
                    </div>
                    <TextAreaField label="Contexte (optionnel)" value={contexte} onChange={(e) => setContexte(e.target.value)} placeholder="Ex: pose veranda chez Mr Dupont, intervention SAV..." rows={2} />
                    <TextAreaField label="Travaux réalisés *" value={travauxRealises} onChange={(e) => setTravauxRealises(e.target.value)} placeholder="Décrivez librement vos travaux (notes brutes OK)" rows={6} hint="Écrivez naturellement, l'IA s'occupe de la mise en forme !" />
                    <TextAreaField label="Points d'attention (optionnel)" value={pointsAttention} onChange={(e) => setPointsAttention(e.target.value)} placeholder="Problèmes rencontrés, points de vigilance..." rows={2} />
                  </div>
                </div>
              )}

              {activeTab === 'photos' && (
                <div>
                  <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-teal-500 hover:bg-teal-50 transition-colors">
                    <Upload size={28} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-600 text-sm">Cliquez pour ajouter des photos</p>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
                  {photos.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {photos.map((photo, index) => (
                        <div key={photo.id} className="relative bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                          <div className="absolute top-1 left-1 bg-teal-500 text-white text-xs font-bold px-2 py-0.5 rounded">{index + 1}</div>
                          <img src={photo.data} alt="" className="w-full h-24 object-cover" />
                          <div className="p-2">
                            <input type="text" value={photo.description} onChange={(e) => updatePhotoDescription(photo.id, e.target.value)} placeholder={`Description photo ${index + 1}`} className="w-full px-2 py-1 text-xs border border-gray-300 rounded" />
                          </div>
                          <button onClick={() => removePhoto(photo.id)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"><X size={10} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <button onClick={generateRapport} disabled={isGenerating} className="w-full bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-lg">
            {isGenerating ? <><Loader className="animate-spin" size={18} /> Reformulation IA en cours...</> : <><FileText size={18} /> 🤖 Générer avec reformulation IA</>}
          </button>
        </section>

        <section className="lg:col-span-2 bg-white rounded-lg shadow p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-800">Aperçu {isEditingContent && <span className="text-teal-600">(mode édition)</span>}</h2>
            <div className="flex gap-2">
              {currentRapport && (
                <>
                  <button onClick={() => setIsEditingContent(!isEditingContent)} className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${isEditingContent ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'} hover:bg-gray-200`}>
                    <Edit3 size={12} /> {isEditingContent ? 'Terminer' : 'Modifier'}
                  </button>
                  <button onClick={saveToList} className="bg-teal-100 text-teal-700 px-2 py-1 rounded text-xs flex items-center gap-1 hover:bg-teal-200">
                    <Save size={12} /> Sauver
                  </button>
                </>
              )}
            </div>
          </div>

          {currentRapport && (
            <div className="mb-3 p-3 bg-gradient-to-r from-gray-50 to-teal-50 rounded-lg border border-teal-200">
              <p className="text-xs font-semibold text-gray-700 mb-2">📥 Télécharger :</p>
              <div className="grid grid-cols-1 gap-2">
                <button onClick={downloadHTMLForPDF} className="bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600 px-3 py-3 rounded text-sm flex items-center justify-center gap-2 font-medium shadow">
                  <FileText size={16} /> 📄 Télécharger pour PDF
                </button>
                <button onClick={copyToClipboard} className="bg-gray-200 text-gray-700 hover:bg-gray-300 px-3 py-2 rounded text-xs flex items-center justify-center gap-1">
                  <Copy size={12} /> Copier le texte
                </button>
              </div>
              
              {showPDFInstructions && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs font-bold text-blue-800 mb-2">📋 Pour créer le PDF :</p>
                  <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                    <li>Ouvrez le fichier <strong>.html</strong> téléchargé</li>
                    <li>Cliquez sur le bouton vert <strong>"Imprimer / Sauvegarder PDF"</strong></li>
                    <li>Dans la fenêtre, choisissez <strong>"Enregistrer en PDF"</strong> comme imprimante</li>
                    <li>Cliquez sur <strong>Enregistrer</strong></li>
                  </ol>
                  <button onClick={() => setShowPDFInstructions(false)} className="mt-2 text-xs text-blue-600 underline">Masquer les instructions</button>
                </div>
              )}
            </div>
          )}

          {generatedContent ? (
            isEditingContent ? (
              <textarea 
                value={generatedContent}
                onChange={handleContentChange}
                className="w-full h-64 sm:h-72 font-mono text-xs p-3 bg-yellow-50 rounded-lg border-2 border-orange-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 resize-none"
                placeholder="Modifiez le texte ici..."
              />
            ) : (
              <pre className="w-full h-64 sm:h-72 overflow-auto font-mono text-xs p-3 bg-gray-50 rounded-lg whitespace-pre-wrap border border-gray-200">{generatedContent}</pre>
            )
          ) : (
            <div className="h-64 sm:h-72 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
              <div className="text-center p-4">
                <FileText size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucun rapport généré</p>
                <p className="text-xs mt-1">Décrivez vos travaux et cliquez sur Générer</p>
                <p className="text-xs text-teal-600 mt-2 font-medium">🤖 L'IA reformulera automatiquement vos textes !</p>
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className="mt-6 pb-4">
        <img src={FOOTER_ALUGLASS} alt="AluGlass Footer" className="w-full max-w-3xl mx-auto px-4" />
      </footer>
    </div>
  );
}
