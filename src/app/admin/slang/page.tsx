"use client";

import React, { useState, useEffect } from "react";
import { useSlangStore } from "@/store/slang-store";
import { extractSlangFromText, ExtractedSlang } from "@/actions/extract-slang";
import { Plus, X, Bot, Save, Database, Code2, ArrowDownToLine } from "lucide-react";

export default function SlangAdminPage() {
    const { addSlang, addSlangBulk, fetchSlang, terms } = useSlangStore();

    // Manual Form State
    const [formData, setFormData] = useState<{
        term: string;
        definition: string;
        example: string;
        tags: string;
        language_code: string;
        type: 'word' | 'phrase';
    }>({
        term: "",
        definition: "",
        example: "",
        tags: "",
        language_code: "en",
        type: "word"
    });

    // Bulk Import State
    const [bulkText, setBulkText] = useState("");
    const [jsonInput, setJsonInput] = useState("");
    const [isParsing, setIsParsing] = useState(false);
    const [parsedItems, setParsedItems] = useState<ExtractedSlang[]>([]);

    useEffect(() => {
        fetchSlang("en");
    }, [fetchSlang]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(t => t);

        await addSlang(
            formData.term,
            formData.definition,
            formData.example,
            tagsArray,
            formData.language_code,
            formData.type
        );

        setFormData(prev => ({ ...prev, term: "", definition: "", example: "", tags: "", type: "word" }));
        alert("Added!");
    };

    const handleBulkParse = async () => {
        if (!bulkText.trim()) return;
        setIsParsing(true);
        const results = await extractSlangFromText(bulkText);
        if (results) {
            setParsedItems(results);
        } else {
            alert("Failed to extract slang.");
        }
        setIsParsing(false);
    };

    const handleJsonParse = () => {
        try {
            const parsed = JSON.parse(jsonInput);
            if (Array.isArray(parsed)) {
                // Validate items roughly
                const validItems = parsed.map((p: any) => ({
                    term: p.term || "",
                    definition: p.definition || "",
                    example: p.example || "",
                    type: p.type || "word",
                    language_code: p.language_code || "en",
                    tags: Array.isArray(p.tags) ? p.tags : []
                }));
                setParsedItems(prev => [...prev, ...validItems]);
                setJsonInput("");
                alert(`Loaded ${validItems.length} terms from JSON.`);
            } else {
                alert("JSON must be an array of objects.");
            }
        } catch (e) {
            alert("Invalid JSON format.");
        }
    };

    const handleSaveBulk = async () => {
        if (parsedItems.length === 0) return;

        await addSlangBulk(parsedItems);

        setParsedItems([]);
        setBulkText("");
        alert(`Saved ${parsedItems.length} terms!`);

        // Refresh to get real IDs
        fetchSlang("en");
    };

    const removeParsedItem = (index: number) => {
        setParsedItems(prev => prev.filter((_, i) => i !== index));
    };

    // Tab State
    const [activeTab, setActiveTab] = useState<'add' | 'manage'>('add');
    const [manageTab, setManageTab] = useState<'word' | 'phrase'>('word');
    const [editingId, setEditingId] = useState<string | null>(null);

    // Initial fetch
    useEffect(() => {
        fetchSlang("en");
    }, [fetchSlang]);

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this term?")) {
            await useSlangStore.getState().deleteSlang(id);
        }
    };

    const handleUpdate = async (id: string, field: keyof ExtractedSlang, value: any) => {
        await useSlangStore.getState().updateSlang(id, { [field]: value });
    };

    const sortedTerms = terms.filter(t => t.type === manageTab || (!t.type && manageTab === 'word')).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return (
        <div style={{ padding: "32px", maxWidth: "800px", margin: "0 auto", paddingBottom: "100px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <h1 style={{ fontSize: "2rem", margin: 0 }}>Admin: Manage Slang Database</h1>
            </div>

            {/* Main Tabs */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "32px", borderBottom: "1px solid var(--color-border)", paddingBottom: "16px" }}>
                <button
                    onClick={() => setActiveTab('add')}
                    style={{
                        padding: "8px 16px",
                        borderRadius: "8px",
                        border: "none",
                        background: activeTab === 'add' ? "var(--color-primary)" : "transparent",
                        color: activeTab === 'add' ? "white" : "var(--color-fg-muted)",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                    }}
                >
                    <Plus size={18} /> Add New
                </button>
                <button
                    onClick={() => setActiveTab('manage')}
                    style={{
                        padding: "8px 16px",
                        borderRadius: "8px",
                        border: "none",
                        background: activeTab === 'manage' ? "var(--color-primary)" : "transparent",
                        color: activeTab === 'manage' ? "white" : "var(--color-fg-muted)",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                    }}
                >
                    <Database size={18} /> Manage Existing
                </button>
            </div>

            {activeTab === 'add' && (
                <>
                    {/* AI Bulk Import Section */}
                    <div style={{
                        background: "linear-gradient(to bottom right, var(--color-surface), var(--color-bg-sub))",
                        padding: "24px",
                        borderRadius: "16px",
                        border: "2px solid var(--color-accent)",
                        marginBottom: "32px"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", color: "var(--color-accent)" }}>
                            <Bot size={24} />
                            <h2 style={{ fontSize: "1.2rem", margin: 0, fontWeight: 700 }}>AI Bulk Import</h2>
                        </div>

                        <textarea
                            value={bulkText}
                            onChange={(e) => setBulkText(e.target.value)}
                            placeholder="Paste unstructured text here... (e.g. 'riz means charisma. no cap means for real.')"
                            rows={4}
                            style={{
                                width: "100%",
                                padding: "16px",
                                borderRadius: "12px",
                                border: "1px solid var(--color-border)",
                                fontFamily: "inherit",
                                marginBottom: "16px",
                                resize: "vertical"
                            }}
                        />

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                            <button
                                onClick={handleBulkParse}
                                disabled={isParsing || !bulkText.trim()}
                                style={{
                                    padding: "10px 20px",
                                    background: "var(--color-fg)",
                                    color: "var(--color-bg)",
                                    borderRadius: "8px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    opacity: isParsing ? 0.7 : 1,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px"
                                }}
                            >
                                {isParsing ? "Parsing..." : (
                                    <>
                                        <Bot size={16} /> Parse with AI
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* JSON Import Section */}
                    <div style={{
                        background: "var(--color-surface)",
                        padding: "24px",
                        borderRadius: "16px",
                        border: "1px dashed var(--color-border)",
                        marginBottom: "32px"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", color: "var(--color-fg-muted)" }}>
                            <Code2 size={24} />
                            <h2 style={{ fontSize: "1.2rem", margin: 0, fontWeight: 700 }}>Direct JSON Import</h2>
                        </div>
                        <textarea
                            value={jsonInput}
                            onChange={(e) => setJsonInput(e.target.value)}
                            placeholder='Paste JSON array here... e.g. [{"term": "foo", "definition": "bar", ...}]'
                            rows={3}
                            style={{
                                width: "100%",
                                padding: "16px",
                                borderRadius: "12px",
                                border: "1px solid var(--color-border)",
                                fontFamily: "monospace",
                                fontSize: "0.9rem",
                                marginBottom: "16px",
                                resize: "vertical"
                            }}
                        />
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            <button
                                onClick={handleJsonParse}
                                disabled={!jsonInput.trim()}
                                style={{
                                    padding: "10px 20px",
                                    background: "var(--color-surface-hover)",
                                    color: "var(--color-fg)",
                                    border: "1px solid var(--color-border)",
                                    borderRadius: "8px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px"
                                }}
                            >
                                <ArrowDownToLine size={16} /> Load JSON
                            </button>
                        </div>
                    </div>

                    {/* Parsed Results Review */}
                    {parsedItems.length > 0 && (
                        <div style={{ marginTop: "24px", borderTop: "1px dashed var(--color-border)", paddingTop: "24px" }}>
                            <h3 style={{ fontSize: "1rem", marginBottom: "12px" }}>Review & Save ({parsedItems.length})</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
                                {parsedItems.map((item, idx) => (
                                    <div key={idx} style={{
                                        background: "var(--color-bg)",
                                        padding: "12px",
                                        borderRadius: "8px",
                                        border: "1px solid var(--color-border)",
                                        position: "relative",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "8px"
                                    }}>
                                        <button
                                            onClick={() => removeParsedItem(idx)}
                                            style={{ position: "absolute", top: "8px", right: "8px", background: "none", border: "none", cursor: "pointer", color: "var(--color-fg-muted)" }}
                                        >
                                            <X size={16} />
                                        </button>

                                        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "8px", alignItems: "center" }}>
                                            <input
                                                value={item.term}
                                                onChange={(e) => {
                                                    const newItems = [...parsedItems];
                                                    newItems[idx].term = e.target.value;
                                                    setParsedItems(newItems);
                                                }}
                                                style={{ fontWeight: 700, border: "1px solid transparent", background: "transparent", width: "100%" }}
                                                placeholder="Term"
                                            />
                                            <select
                                                value={item.type || 'word'}
                                                onChange={(e) => {
                                                    const newItems = [...parsedItems];
                                                    newItems[idx].type = e.target.value as 'word' | 'phrase';
                                                    setParsedItems(newItems);
                                                }}
                                                style={{ fontSize: "0.8em", padding: "4px", borderRadius: "4px", border: "1px solid var(--color-border)", background: "var(--color-surface)" }}
                                            >
                                                <option value="word">Word</option>
                                                <option value="phrase">Phrase</option>
                                            </select>
                                        </div>
                                        <div style={{ fontSize: "0.8em", opacity: 0.7 }}>({item.language_code})</div>

                                        <textarea
                                            value={item.definition}
                                            onChange={(e) => {
                                                const newItems = [...parsedItems];
                                                newItems[idx].definition = e.target.value;
                                                setParsedItems(newItems);
                                            }}
                                            style={{ fontSize: "0.9em", border: "1px solid var(--color-border)", borderRadius: "4px", padding: "4px", width: "100%", background: "var(--color-surface)", resize: "vertical" }}
                                            placeholder="Definition"
                                            rows={2}
                                        />

                                        <input
                                            value={item.example}
                                            onChange={(e) => {
                                                const newItems = [...parsedItems];
                                                newItems[idx].example = e.target.value;
                                                setParsedItems(newItems);
                                            }}
                                            style={{ fontSize: "0.85em", fontStyle: "italic", border: "1px solid transparent", background: "transparent", width: "100%", color: "var(--color-fg-muted)" }}
                                            placeholder="Example sentence"
                                        />
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={handleSaveBulk}
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    background: "var(--color-success, #22c55e)",
                                    color: "white",
                                    borderRadius: "8px",
                                    fontWeight: 700,
                                    border: "none",
                                    cursor: "pointer",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    gap: "8px"
                                }}
                            >
                                <Save size={18} /> Save All Terms
                            </button>
                        </div>
                    )}

                    <h2 style={{ fontSize: "1.5rem", marginBottom: "16px" }}>Manual Entry</h2>

                    <form onSubmit={handleSubmit} style={{
                        background: "var(--color-surface)",
                        padding: "24px",
                        borderRadius: "16px",
                        border: "1px solid var(--color-border)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px"
                    }}>
                        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "16px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                <label style={{ fontSize: "0.9rem", fontWeight: 600 }}>Slang Term</label>
                                <input
                                    name="term"
                                    value={formData.term}
                                    onChange={handleChange}
                                    placeholder="e.g. rizz"
                                    required
                                    style={{ padding: "12px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "var(--color-bg)" }}
                                />
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                <label style={{ fontSize: "0.9rem", fontWeight: 600 }}>Type</label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    style={{ padding: "12px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "var(--color-bg)" }}
                                >
                                    <option value="word">Word</option>
                                    <option value="phrase">Phrase</option>
                                </select>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                <label style={{ fontSize: "0.9rem", fontWeight: 600 }}>Language</label>
                                <select
                                    name="language_code"
                                    value={formData.language_code}
                                    onChange={handleChange}
                                    style={{ padding: "12px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "var(--color-bg)" }}
                                >
                                    <option value="en">English</option>
                                    <option value="ja">Japanese</option>
                                    <option value="ko">Korean</option>
                                    <option value="es">Spanish</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <label style={{ fontSize: "0.9rem", fontWeight: 600 }}>Definition</label>
                            <textarea
                                name="definition"
                                value={formData.definition}
                                onChange={handleChange}
                                placeholder="Explanation of meaning and usage..."
                                required
                                rows={3}
                                style={{ padding: "12px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "var(--color-bg)", resize: "vertical" }}
                            />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <label style={{ fontSize: "0.9rem", fontWeight: 600 }}>Example Sentence</label>
                            <textarea
                                name="example"
                                value={formData.example}
                                onChange={handleChange}
                                placeholder="Contextual example..."
                                required
                                rows={2}
                                style={{ padding: "12px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "var(--color-bg)", resize: "vertical" }}
                            />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <label style={{ fontSize: "0.9rem", fontWeight: 600 }}>Tags (comma separated)</label>
                            <input
                                name="tags"
                                value={formData.tags}
                                onChange={handleChange}
                                placeholder="gen-z, casual, internet"
                                style={{ padding: "12px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "var(--color-bg)" }}
                            />
                        </div>

                        <button
                            type="submit"
                            style={{
                                marginTop: "8px",
                                padding: "12px",
                                background: "var(--color-primary)",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px"
                            }}
                        >
                            <Plus size={20} />
                            Add Term
                        </button>
                    </form>
                </>
            )
            }

            {
                activeTab === 'manage' && (
                    <div style={{ marginTop: "40px" }}>
                        <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
                            <button
                                onClick={() => setManageTab('word')}
                                style={{
                                    padding: "8px 16px",
                                    borderRadius: "20px",
                                    border: "1px solid var(--color-border)",
                                    background: manageTab === 'word' ? "var(--color-fg)" : "var(--color-bg)",
                                    color: manageTab === 'word' ? "var(--color-bg)" : "var(--color-fg)",
                                    fontWeight: 700,
                                    cursor: "pointer"
                                }}
                            >
                                Words
                            </button>
                            <button
                                onClick={() => setManageTab('phrase')}
                                style={{
                                    padding: "8px 16px",
                                    borderRadius: "20px",
                                    border: "1px solid var(--color-border)",
                                    background: manageTab === 'phrase' ? "var(--color-fg)" : "var(--color-bg)",
                                    color: manageTab === 'phrase' ? "var(--color-bg)" : "var(--color-fg)",
                                    fontWeight: 700,
                                    cursor: "pointer"
                                }}
                            >
                                Phrases
                            </button>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {sortedTerms.map(t => (
                                <div key={t.id} style={{
                                    padding: "16px",
                                    background: "var(--color-surface)",
                                    borderRadius: "12px",
                                    border: "1px solid var(--color-border)",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "8px"
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                        <div style={{ flex: 1 }}>
                                            {editingId === t.id ? (
                                                <input
                                                    value={t.term}
                                                    onChange={(e) => handleUpdate(t.id, 'term', e.target.value)}
                                                    style={{ fontSize: "1.1rem", fontWeight: 700, background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: "4px", padding: "4px", width: "100%" }}
                                                />
                                            ) : (
                                                <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{t.term}</div>
                                            )}

                                            {editingId === t.id ? (
                                                <textarea
                                                    value={t.definition}
                                                    onChange={(e) => handleUpdate(t.id, 'definition', e.target.value)}
                                                    style={{ fontSize: "0.9rem", marginTop: "4px", background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: "4px", padding: "4px", width: "100%", resize: "vertical" }}
                                                />
                                            ) : (
                                                <div style={{ fontSize: "0.9rem", color: "var(--color-fg-muted)" }}>{t.definition}</div>
                                            )}
                                        </div>
                                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                            <div style={{ fontSize: "0.8rem", background: "var(--color-bg)", padding: "4px 8px", borderRadius: "4px" }}>{t.language_code}</div>
                                            <button
                                                onClick={() => setEditingId(editingId === t.id ? null : t.id)}
                                                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-fg-primary)" }}
                                            >
                                                {editingId === t.id ? "Done" : "Edit"}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(t.id)}
                                                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-error, #ef4444)" }}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    {editingId === t.id ? (
                                        <input
                                            value={t.example}
                                            onChange={(e) => handleUpdate(t.id, 'example', e.target.value)}
                                            style={{ fontSize: "0.85rem", fontStyle: "italic", background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: "4px", padding: "4px", width: "100%" }}
                                        />
                                    ) : (
                                        <div style={{ fontSize: "0.85rem", fontStyle: "italic", color: "var(--color-fg-muted)" }}>"{t.example}"</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }
        </div >
    );
}
