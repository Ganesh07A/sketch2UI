"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Copy, Code, Settings2, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function UploadSketchPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uiJson, setUiJson] = useState(null);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [theme, setTheme] = useState("modern");

  // Visual Themes (Keep your existing themes)
  const themes = {
    modern: { bg: "bg-white", text: "text-gray-900", primary: "bg-blue-600 text-white", secondary: "bg-gray-100", input: "border-gray-300", nav: "bg-white border-b", font: "font-sans" },
    dark: { bg: "bg-slate-900", text: "text-slate-50", primary: "bg-indigo-500 text-white", secondary: "bg-slate-800", input: "bg-slate-800 border-slate-700", nav: "bg-slate-900 border-slate-800", font: "font-sans" },
    retro: { bg: "bg-stone-100", text: "text-stone-800", primary: "bg-orange-600 text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]", secondary: "bg-white border-2 border-black", input: "bg-white border-2 border-black", nav: "bg-orange-100 border-b-2 border-black", font: "font-mono" }
  };
  const activeTheme = themes[theme];

  const handleFileChange = (e) => e.target.files && setFile(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast("Upload an image first");
    setLoading(true); setUiJson(null); setSelectedElementId(null);
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("http://localhost:8000/api/upload", { method: "POST", body: data });
      if (!res.ok) throw new Error("Server error");
      const result = await res.json();
      setUiJson(injectIds(result.ui_description));
      toast("UI generated! 🎨");
    } catch (err) { toast("Error", { description: err.message }); } 
    finally { setLoading(false); }
  };

  const handleUpdateElement = (id, field, value) => {
    setUiJson((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      next.sections?.forEach((s) => (s.elements || []).forEach((el) => {
          if (el.id === id) el[field] = value;
      }));
      return next;
    });
  };

  const activeElement = uiJson?.sections?.flatMap(s => s.elements || []).find(el => el.id === selectedElementId);

  return (
    <div className={`flex min-h-screen ${activeTheme.bg} transition-colors duration-300`}>
      {/* Canvas */}
      <div className="flex-1 p-8 overflow-y-auto h-screen">
        <Card className="mb-8">
           <CardContent className="pt-6">
             <form onSubmit={handleSubmit} className="flex gap-4">
               <Input type="file" onChange={handleFileChange} />
               <Button disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : "Generate UI"}</Button>
             </form>
           </CardContent>
        </Card>

        {uiJson && (
          <div className={`max-w-5xl mx-auto ${activeTheme.bg} ${activeTheme.text} shadow-xl rounded-xl p-10 relative border transition-colors min-h-[600px]`}>
            {/* Toolbar */}
            <div className="absolute top-4 right-4 flex gap-2 z-10">
               <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(JSON.stringify(uiJson, null, 2))}><Copy className="h-4 w-4" /></Button>
            </div>

            <h1 className="text-3xl font-bold text-center mb-10">{uiJson.screen_name}</h1>

            {uiJson.sections?.map((section, idx) => (
              <div key={idx} className="mb-12">
                {section.title && <h2 className="text-xl font-semibold mb-6 opacity-70 uppercase tracking-wide">{section.title}</h2>}
                <AdaptiveGrid layout={uiJson.layout}>
                  {(section.elements || []).map((el) => (
                    <div 
                      key={el.id} 
                      onClick={(e) => { e.stopPropagation(); setSelectedElementId(el.id); }}
                      className={`relative group cursor-pointer border-2 transition-all p-3 rounded-lg
                        ${selectedElementId === el.id ? 'border-blue-500 ring-2 ring-blue-100 bg-blue-50/10' : 'border-transparent hover:border-gray-300 hover:bg-gray-50/50'}
                        ${el.type === 'navbar' || el.type === 'table' ? 'col-span-full' : ''}
                      `}
                    >
                      {/* === RENDER ELEMENT === */}
                      <RenderElement element={el} themeConfig={activeTheme} />
                    </div>
                  ))}
                </AdaptiveGrid>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sidebar Editor */}
      {uiJson && (
        <div className="w-80 bg-white border-l p-6 h-screen sticky top-0 overflow-y-auto text-gray-900 shadow-xl z-20">
          <div className="mb-6">
            <Label className="text-xs font-bold text-gray-500 uppercase">Theme</Label>
            <div className="flex gap-2 mt-2">
              {Object.keys(themes).map(t => (
                <button key={t} onClick={() => setTheme(t)} className={`px-3 py-1 text-sm rounded border capitalize ${theme === t ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-gray-50'}`}>{t}</button>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between items-center mb-6 border-b pb-2">
            <h3 className="font-bold flex items-center gap-2"><Settings2 className="w-4 h-4" /> Properties</h3>
            {selectedElementId && <Button variant="ghost" size="icon" onClick={() => setSelectedElementId(null)}><X className="w-4 h-4" /></Button>}
          </div>

          {activeElement ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div className="text-xs font-mono bg-blue-100 text-blue-700 p-2 rounded uppercase font-bold">Type: {activeElement.type}</div>
              
              <div className="space-y-1">
                <Label>Label Text</Label>
                <Input value={activeElement.label || ""} onChange={(e) => handleUpdateElement(activeElement.id, "label", e.target.value)} />
              </div>
              
              {activeElement.type === 'input' && (
                 <div className="space-y-1">
                   <Label>Placeholder</Label>
                   <Input value={activeElement.placeholder || ""} onChange={(e) => handleUpdateElement(activeElement.id, "placeholder", e.target.value)} />
                 </div>
              )}

              <div className="space-y-1">
                 <Label>Alignment</Label>
                 <div className="flex gap-1">
                   {['left', 'center', 'right'].map(pos => (
                     <button key={pos} onClick={() => handleUpdateElement(activeElement.id, "position", pos)} 
                       className={`flex-1 py-1 text-xs border rounded ${activeElement.position === pos ? 'bg-gray-800 text-white' : 'hover:bg-gray-100'}`}>
                       {pos}
                     </button>
                   ))}
                 </div>
              </div>
            </div>
          ) : <div className="text-gray-400 text-center py-10">Click an element on the left to edit it.</div>}
        </div>
      )}
    </div>
  );
}

// --- HELPERS ---
function injectIds(json) {
  if (!json?.sections) return json;
  json.sections.forEach(s => (s.elements || []).forEach(el => { if(!el.id) el.id = Math.random().toString(36).substr(2,9); }));
  return json;
}

function AdaptiveGrid({ children, layout }) {
  return <div className={`grid gap-6 ${layout === "two-column" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>{children}</div>;
}

// --- RENDERER (FIXED) ---
function RenderElement({ element, themeConfig }) {
  if (!element) return null;
  const t = themeConfig; 

  // Flexbox Alignment
  const justifyClass = element.position === "right" ? "justify-end" : element.position === "center" ? "justify-center" : "justify-start";
  const alignClass = element.position === "right" ? "text-right" : element.position === "center" ? "text-center" : "text-left";
  const Container = ({ children }) => <div className={`flex w-full ${justifyClass}`}>{children}</div>;

  // Generic Label Filter: If label is "Input Field" or empty, don't show it as a label
  const showLabel = element.label && !["Input Field", "Text Input", "Button", "Dropdown"].includes(element.label);

  switch (element.type) {
    case "heading": return <h1 className={`text-3xl font-bold w-full ${alignClass} ${t.font}`}>{element.label}</h1>;
    case "text": return <p className={`w-full ${alignClass} ${t.font} opacity-80`}>{element.label}</p>;

    case "button": 
      return (
        <Container>
          {/* pointer-events-none ensures the CLICK goes to the Editor Selection, not the button action */}
          <Button className={`${t.primary} ${t.font} pointer-events-none`}>{element.label || "Button"}</Button>
        </Container>
      );

    case "input": 
      return (
        <div className="w-full space-y-2 pointer-events-none"> {/* Disable interaction so we can SELECT the box */}
          {showLabel && <Label className={t.font}>{element.label}</Label>}
          <Input placeholder={element.placeholder || "..."} className={`${t.input} ${t.font}`} /> 
        </div>
      );

    case "table": 
      return (
        <div className="w-full overflow-hidden rounded-lg border border-gray-200 pointer-events-none">
           <table className="w-full text-sm text-left">
             <thead className={`bg-gray-50 ${t.text}`}>
               <tr>
                 {(element.headers || ["Col 1", "Col 2", "Col 3"]).map((h, i) => <th key={i} className="p-3 font-medium">{h}</th>)}
               </tr>
             </thead>
             <tbody>
               {(element.rows || [["-", "-", "-"]]).map((row, r) => (
                 <tr key={r} className="border-t">
                   {row.map((cell, c) => <td key={c} className="p-3 opacity-80">{cell}</td>)}
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      );
    
    case "navbar":
        return (
            <div className={`w-full flex items-center justify-between px-6 py-4 rounded-lg border ${t.nav} pointer-events-none`}>
                <span className="font-bold text-xl">{element.label || "Logo"}</span>
                <div className="flex gap-3">
                    {(element.items || [{label:"Home"}, {label:"About"}]).map((item, i) => (
                        <span key={i} className="text-sm font-medium opacity-70 hover:opacity-100">{item.label}</span>
                    ))}
                </div>
            </div>
        );

    default: 
      // Fallback for new types
      return (
        <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded bg-gray-50 text-gray-400">
           <AlertCircle className="mb-1 h-5 w-5" />
           <span className="text-xs uppercase">{element.type}</span>
           <span className="text-sm font-medium text-gray-600">{element.label}</span>
        </div>
      );
  }
}