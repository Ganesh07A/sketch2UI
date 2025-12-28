"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Upload, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function UploadSketchPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uiJson, setUiJson] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast("Upload an image first");

    setLoading(true);

    try {
      const data = new FormData();
      data.append("file", file);

      const res = await fetch("http://localhost:8000/api/upload", {
        method: "POST",
        body: data,
      });

      const result = await res.json();
      setUiJson(result.ui_description);

      toast("UI generated successfully 🎨");
    } catch (err) {
      toast("Upload failed", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto mt-8 p-6 space-y-8">

      {/* Upload Box */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Sketch</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Label>Attach Image</Label>

            <div className="border-2 border-dashed rounded-xl p-8 text-center relative cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleFileChange}
              />

              {file ? (
                <p className="flex gap-2 justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  {file.name}
                </p>
              ) : (
                <p>Click to upload sketch image</p>
              )}
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <Loader2 className="animate-spin" /> : "Generate UI"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ==================== UI Preview ==================== */}
      {uiJson && (
        <div className="w-full bg-white shadow-2xl rounded-2xl p-10 space-y-10">

          {/* -------- FULL-WIDTH NAVBAR if exists -------- */}
          {findNavbar(uiJson.sections) && (
            <NavbarRenderer element={findNavbar(uiJson.sections)} />
          )}

          {/* -------- Screen Title -------- */}
          <h1 className="text-3xl font-bold text-center">
            {uiJson.screen_name || "Untitled Screen"}
          </h1>

          {/* -------- Sections Renderer -------- */}
          {uiJson.sections?.map((section, idx) =>
            !section.elements?.some((e) => e.type === "navbar") ? (
              <div key={idx} className="space-y-6">
                <h2 className="text-xl font-semibold">{section.title}</h2>

                <AdaptiveGrid layout={uiJson.layout}>
                  {section.elements?.map((el, i) => (
                    <RenderElement key={i} element={el} />
                  ))}
                </AdaptiveGrid>
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- helper: detect navbar ---------- */
function findNavbar(sections) {
  if (!sections) return null;
  for (const s of sections) {
    const nav = s.elements?.find((e) => e.type === "navbar");
    if (nav) return nav;
  }
  return null;
}

/* ---------- NAVBAR (full width, not inside grid) ---------- */
function NavbarRenderer({ element }) {
  return (
    <div className="w-full flex items-center justify-between px-6 py-4 rounded-xl border bg-gray-50">
      <h1 className="text-2xl font-bold">{element.brand || "App"}</h1>

      <div className="flex gap-3 flex-wrap">
        {element.items?.map((item, i) => (
          <button
            key={i}
            className={`px-5 py-2 rounded-full ${
              item.variant === "primary"
                ? "bg-blue-600 text-white"
                : "bg-white border"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- adaptive layout grid ---------- */
function AdaptiveGrid({ children, layout }) {
  const map = {
    "single-column": "grid-cols-1",
    "two-column": "grid-cols-2",
    "three-column": "grid-cols-3",
  };

  return (
    <div className={`grid gap-6 ${map[layout] || "grid-cols-1"}`}>
      {children}
    </div>
  );
}

/* ---------- universal element renderer ---------- */
function RenderElement({ element }) {
  // text alignment logic
  const align =
    element.position === "left"
      ? "text-left"
      : element.position === "right"
      ? "text-right"
      : "text-center";

  switch (element.type) {
    case "heading":
      return (
        <h1 className={`text-2xl font-bold ${align}`}>{element.label}</h1>
      );

    case "subheading":
      return (
        <p className={`text-gray-500 text-lg ${align}`}>{element.label}</p>
      );

    case "text":
      return <p className={`${align}`}>{element.label}</p>;

    case "input":
      return (
        <div className="space-y-1">
          <Label>{element.label}</Label>
          <input
            className="border rounded-xl w-full px-3 py-2"
            defaultValue={element.value || ""}
            placeholder={element.placeholder || ""}
          />
        </div>
      );

    case "select":
      return (
        <div className="space-y-1">
          <Label>{element.label}</Label>
          <select className="border rounded-xl w-full px-3 py-2">
            {element.options?.map((o, i) => (
              <option key={i}>{o}</option>
            ))}
          </select>
        </div>
      );

    case "number":
      return (
        <div className="space-y-1">
          <Label>{element.label}</Label>
          <input
            type="number"
            className="border rounded-xl w-full px-3 py-2"
            defaultValue={element.value}
          />
        </div>
      );

    case "button":
      return (
        <button className="px-5 py-2 rounded-xl bg-blue-600 text-white w-full">
          {element.label}
        </button>
      );

    case "image": {
      const sizeClass =
        element.size === "large"
          ? "w-56 h-56"
          : element.size === "small"
          ? "w-16 h-16"
          : "w-32 h-32";

      const containerAlign =
        element.position === "left"
          ? "justify-start"
          : element.position === "right"
          ? "justify-end"
          : "justify-center";

      return (
        <div className={`flex ${containerAlign}`}>
          <div
            className={`bg-gray-200 ${sizeClass} rounded-xl flex items-center justify-center`}
          >
            🖼️ {element.alt || "image"}
          </div>
        </div>
      );
    }

    case "table":
      return (
        <table className="border w-auto text-sm text-center">
          <thead>
            <tr>
              {element.headers?.map((h, i) => (
                <th key={i} className="border px-3 py-1 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {element.rows?.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => (
                  <td key={c} className="border px-3 py-1">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );

    default:
      return <p className="text-red-500">Unknown element</p>;
  }
}
