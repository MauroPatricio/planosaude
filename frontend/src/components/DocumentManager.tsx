import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, Upload, Trash2, Download, 
  ExternalLink, Eye, AlertCircle, CheckCircle, Clock 
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface Document {
  _id: string;
  name: string;
  originalName: string;
  type: string;
  url: string;
  status: string;
  createdAt: string;
}

interface DocumentManagerProps {
  entityId: string;
  entityType: 'Client' | 'Member' | 'Sale' | 'ApprovalRequest';
  title?: string;
  readOnly?: boolean;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({ 
  entityId, 
  entityType, 
  title = "Documentação", 
  readOnly = false 
}) => {
  const { token } = useAuthStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchDocuments = async () => {
    try {
      const { data } = await axios.get(`/api/documents/entity/${entityId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(data);
    } catch (err) {
      console.error('Erro ao carregar documentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (entityId) fetchDocuments();
  }, [entityId, token]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityId', entityId);
    formData.append('entityType', entityType);
    formData.append('type', 'id_card'); // Default for now, can be improved with a dropdown

    setUploading(true);
    try {
      await axios.post('/api/documents/upload', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      fetchDocuments();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro no upload');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem a certeza que deseja remover este documento?')) return;
    try {
      await axios.delete(`/api/documents/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDocuments();
    } catch (err) {
      alert('Erro ao eliminar documento');
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-widest">{title}</h3>
        {!readOnly && (
          <label className="cursor-pointer bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
            <Upload className="w-3 h-3" />
            Upload
            <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} accept=".pdf,.jpg,.jpeg,.png" />
          </label>
        )}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="p-4 bg-slate-900/30 rounded-xl border border-dashed border-slate-800 text-center text-[10px] text-slate-500 uppercase font-bold">Procurando arquivos...</div>
        ) : documents.length === 0 ? (
          <div className="p-6 bg-slate-900/30 rounded-xl border border-dashed border-slate-700 text-center">
             <FileText className="w-8 h-8 text-slate-700 mx-auto mb-2 opacity-50" />
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Nenhum documento anexado</p>
          </div>
        ) : (
          documents.map((doc) => (
            <div key={doc._id} className="group p-3 rounded-xl bg-slate-900/50 border border-white/5 hover:border-primary-500/30 transition-all flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-primary-400 group-hover:bg-primary-500/10 transition-all">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white truncate max-w-[150px]">{doc.originalName}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-500 font-bold uppercase">{new Date(doc.createdAt).toLocaleDateString()}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                    <span className={`text-[8px] font-black uppercase ${doc.status === 'verified' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {doc.status === 'verified' ? 'Verificado' : 'Pendente'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <a 
                  href={`http://localhost:5000${doc.url}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                  title="Visualizar"
                >
                  <Eye className="w-4 h-4" />
                </a>
                {!readOnly && (
                  <button 
                    onClick={() => handleDelete(doc._id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                    title="Remover"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DocumentManager;
