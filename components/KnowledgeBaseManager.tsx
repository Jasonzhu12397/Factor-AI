
import React, { useState } from 'react';
import { KnowledgeBase, Document } from '../types';
import { Plus, Trash2, FileText, Upload, Database } from './Icons';
import { aiService } from '../services/aiService';

interface KnowledgeBaseManagerProps {
  knowledgeBases: KnowledgeBase[];
  onUpdate: (kb: KnowledgeBase[]) => void;
}

const KnowledgeBaseManager: React.FC<KnowledgeBaseManagerProps> = ({ knowledgeBases, onUpdate }) => {
  const [activeKBId, setActiveKBId] = useState<string | null>(knowledgeBases[0]?.id || null);
  const [isSyncing, setIsSyncing] = useState(false);

  const addKB = () => {
    const name = prompt("输入知识库名称:");
    if (!name) return;
    const newKB: KnowledgeBase = {
      id: Date.now().toString(),
      name,
      description: "私有 RAG 知识库",
      documents: [],
      createdAt: Date.now()
    };
    onUpdate([...knowledgeBases, newKB]);
    setActiveKBId(newKB.id);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeKBId || !e.target.files) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      setIsSyncing(true);
      const content = event.target?.result as string;
      
      // 1. 同步到后端进行 RAG 向量化
      const syncResult = await aiService.syncDocument(activeKBId, file.name, content);
      
      if (syncResult) {
        const newDoc: Document = {
          id: Date.now().toString(),
          name: file.name,
          content: content,
          size: file.size,
          type: file.type,
          createdAt: Date.now()
        };

        onUpdate(knowledgeBases.map(kb => 
          kb.id === activeKBId ? { ...kb, documents: [...kb.documents, newDoc] } : kb
        ));
      } else {
        alert("后端连接失败，文档未能向量化。请确保 Python 后端已运行。");
      }
      setIsSyncing(false);
    };
    reader.readAsText(file);
  };

  const deleteDoc = (kbId: string, docId: string) => {
    onUpdate(knowledgeBases.map(kb => 
      kb.id === kbId ? { ...kb, documents: kb.documents.filter(d => d.id !== docId) } : kb
    ));
  };

  const activeKB = knowledgeBases.find(k => k.id === activeKBId);

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="w-64 border-r dark:border-slate-800 p-4 space-y-4 overflow-y-auto">
        <button onClick={addKB} className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-indigo-500/20">
          <Plus size={16} /> 创建知识库
        </button>
        <div className="space-y-1">
          {knowledgeBases.map(kb => (
            <button 
              key={kb.id} 
              onClick={() => setActiveKBId(kb.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${activeKBId === kb.id ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600'}`}
            >
              📚 {kb.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        {activeKB ? (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-black tracking-tighter">{activeKB.name}</h2>
                <p className="text-slate-400 font-medium">包含 {activeKB.documents.length} 个文档</p>
              </div>
              <label className={`flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold cursor-pointer hover:bg-indigo-700 transition-all ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {isSyncing ? '正在同步到向量库...' : <><Upload size={18} /> 上传并向量化 (TXT/MD)</>}
                <input type="file" className="hidden" accept=".txt,.md" onChange={handleFileUpload} disabled={isSyncing} />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeKB.documents.map(doc => (
                <div key={doc.id} className="p-4 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl flex items-center gap-4 group">
                  <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">
                    <FileText size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm truncate">{doc.name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold">{(doc.size / 1024).toFixed(1)} KB • 同步成功</p>
                  </div>
                  <button onClick={() => deleteDoc(activeKB.id, doc.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {activeKB.documents.length === 0 && (
                <div className="col-span-full py-20 border-2 border-dashed dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-400">
                  <Database size={48} className="mb-4 opacity-20" />
                  <p className="font-bold text-center">暂无文档<br/>上传后后端会自动进行 RAG 向量切片</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
             <Database size={64} className="mb-4 opacity-10" />
             <p className="font-black text-xl uppercase tracking-widest">请选择或创建一个知识库</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeBaseManager;
