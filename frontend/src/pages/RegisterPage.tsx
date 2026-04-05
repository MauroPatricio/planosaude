import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Building2, Lock, Mail, User as UserIcon, Loader2, 
  ChevronRight, AlertCircle, Briefcase, Globe, Phone,
  CheckCircle2, Search, ChevronDown, Eye, EyeOff
} from 'lucide-react';

const CURRENCIES = [
  { code: 'MZN', name: 'Metical moçambicano', symbol: 'MT' },
  { code: 'USD', name: 'Dólar americano', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'ZAR', name: 'Rand sul-africano', symbol: 'R' },
  { code: 'BRL', name: 'Real brasileiro', symbol: 'R$' },
  { code: 'GBP', name: 'Libra esterlina', symbol: '£' },
  { code: 'AED', name: 'Dirham dos Emirados Árabes Unidos', symbol: 'د.إ' },
  { code: 'INR', name: 'Rupia indiana', symbol: '₹' },
  { code: 'CNY', name: 'Yuan chinês', symbol: '¥' },
  { code: 'AOA', name: 'Kwanza angolano', symbol: 'Kz' },
];

const RegisterPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: '',
    companyType: 'Corretora de Seguros',
    customCompanyType: '',
    currency: 'MZN',
    contactEmail: '',
    contactPhone: '',
    adminName: '',
    adminEmail: '',
    password: '',
    confirmPassword: ''
  });
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        companyType: formData.companyType === 'Outro' ? formData.customCompanyType : formData.companyType,
        country: CURRENCIES.find(c => c.code === formData.currency)?.name || formData.currency
      };
      
      await axios.post('/api/auth/register-tenant', payload);
      setIsSuccess(true);
      // Optional: automatically redirect after 5 seconds
      // setTimeout(() => navigate('/login'), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar conta. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const filteredCurrencies = CURRENCIES.filter(c => 
    c.name.toLowerCase().includes(currencySearch.toLowerCase()) || 
    c.code.toLowerCase().includes(currencySearch.toLowerCase())
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 overflow-hidden relative font-sans">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-600/10 blur-[120px] rounded-full animate-pulse-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary-600/10 blur-[100px] rounded-full" />
      
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')] opacity-10 pointer-events-none mix-blend-overlay"></div>

      <div className="w-full max-w-[540px] z-10">
        <div className="glass-card p-8 sm:p-10 shadow-2xl shadow-black/50 border-white/5 relative overflow-hidden">
          {isSuccess ? (
            <div className="text-center py-8 animate-in fade-in zoom-in duration-500">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Conta Criada com Sucesso!</h2>
              <p className="text-slate-400 text-lg mb-10 max-w-xs mx-auto">
                A sua organização <strong>{formData.companyName}</strong> foi registada. Agora já pode aceder ao sistema.
              </p>
              
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-900/20 transform active:scale-[0.98] transition-all flex items-center justify-center gap-2 group overflow-hidden relative"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Fazer Login Agora
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] transition-all"></div>
              </button>
            </div>
          ) : (
            <>
              {/* Progress Bar */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-900">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                  style={{ width: `${(step / 2) * 100}%` }}
                />
              </div>

              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-6 shadow-inner">
                  {step === 1 ? (
                    <Building2 className="w-10 h-10 text-emerald-400" />
                  ) : (
                    <UserIcon className="w-10 h-10 text-emerald-400" />
                  )}
                </div>
                <h1 className="text-4xl font-bold text-white tracking-tight font-outfit mb-2">
                  {step === 1 ? 'Registrar Empresa' : 'Dados do Administrador'}
                </h1>
                <p className="text-slate-400 font-medium tracking-wide">
                  {step === 1 ? 'Comece a gerir a sua organização hoje' : 'Crie o seu perfil de administrador principal'}
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-8 text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="font-medium">{error}</p>
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-6">
                {step === 1 ? (
                  <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-400 ml-1 tracking-wide uppercase text-[10px]">Nome da Empresa</label>
                      <div className="relative group">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                        <input
                          type="text"
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleChange}
                          className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all font-medium"
                          placeholder="Nome oficial da organização"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-400 ml-1 tracking-wide uppercase text-[10px]">Tipo de Negócio</label>
                        <div className="relative group">
                          <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors pointer-events-none" />
                          <select
                            name="companyType"
                            value={formData.companyType}
                            onChange={handleChange}
                            className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all appearance-none cursor-pointer font-medium"
                            required
                          >
                            <option value="Corretora de Seguros">Corretora de Seguros</option>
                            <option value="Outro">Outro</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2 relative">
                        <label className="text-sm font-semibold text-slate-400 ml-1 tracking-wide uppercase text-[10px]">País / Moeda</label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
                            className="w-full relative bg-slate-900/60 border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 text-white hover:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all font-medium flex items-center justify-between"
                          >
                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 transition-colors" />
                            <span className="truncate pr-4 text-slate-300">
                              {formData.currency ? `${CURRENCIES.find(c => c.code === formData.currency)?.name} (${formData.currency})` : 'Selecione uma moeda'}
                            </span>
                            <ChevronDown className="w-4 h-4 text-slate-500" />
                          </button>

                          {isCurrencyDropdownOpen && (
                            <div className="absolute z-50 w-full mt-2 bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden glass-card">
                              <div className="p-3 border-b border-slate-800">
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                  <input
                                    type="text"
                                    placeholder="Pesquisar moeda..."
                                    value={currencySearch}
                                    onChange={(e) => setCurrencySearch(e.target.value)}
                                    className="w-full bg-slate-800/50 rounded-lg py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 border border-slate-700/50"
                                  />
                                </div>
                              </div>
                              <div className="max-h-48 overflow-y-auto w-full custom-scrollbar">
                                {filteredCurrencies.map((c) => (
                                  <button
                                    key={c.code}
                                    type="button"
                                    onClick={() => {
                                      setFormData({...formData, currency: c.code});
                                      setIsCurrencyDropdownOpen(false);
                                      setCurrencySearch('');
                                    }}
                                    className={`w-full text-left px-4 py-3 hover:bg-emerald-500/10 transition-colors flex items-center justify-between ${formData.currency === c.code ? 'bg-emerald-500/5 text-emerald-400' : 'text-slate-300'}`}
                                  >
                                    <span className="truncate text-sm">{c.name}</span>
                                    <span className="text-xs font-mono opacity-60 ml-2 shrink-0">{c.code} ({c.symbol})</span>
                                  </button>
                                ))}
                                {filteredCurrencies.length === 0 && (
                                  <div className="p-4 text-center text-slate-500 text-sm">
                                    Nenhuma moeda encontrada.
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {formData.companyType === 'Outro' && (
                        <div className="space-y-2 col-span-2">
                          <label className="text-sm font-semibold text-slate-400 ml-1 tracking-wide uppercase text-[10px]">Especificar Tipo de Negócio</label>
                          <div className="relative group">
                            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors pointer-events-none" />
                            <input
                              type="text"
                              name="customCompanyType"
                              value={formData.customCompanyType}
                              onChange={handleChange}
                              className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all font-medium"
                              placeholder="Ex: Clínica, Restaurante, Consultoria, etc."
                              required
                            />
                          </div>
                        </div>
                      )}

                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-400 ml-1 tracking-wide uppercase text-[10px]">Email Institucional</label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                        <input
                          type="email"
                          name="contactEmail"
                          value={formData.contactEmail}
                          onChange={handleChange}
                          className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all font-medium"
                          placeholder="geral@empresa.com"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-400 ml-1 tracking-wide uppercase text-[10px]">Contacto Telefónico</label>
                      <div className="relative group">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                        <input
                          type="text"
                          name="contactPhone"
                          value={formData.contactPhone}
                          onChange={handleChange}
                          className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all font-medium"
                          placeholder="+258 ..."
                          required
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-400 ml-1 tracking-wide uppercase text-[10px]">Nome Completo</label>
                      <div className="relative group">
                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                        <input
                          type="text"
                          name="adminName"
                          value={formData.adminName}
                          onChange={handleChange}
                          className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all font-medium"
                          placeholder="Nome do Administrador"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-400 ml-1 tracking-wide uppercase text-[10px]">Email de Acesso</label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                        <input
                          type="email"
                          name="adminEmail"
                          value={formData.adminEmail}
                          onChange={handleChange}
                          className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all font-medium"
                          placeholder="seuemail@gmail.com"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-400 ml-1 tracking-wide uppercase text-[10px]">Palavra-passe</label>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={`w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3.5 pl-12 pr-12 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all text-lg ${!showPassword ? 'italic tracking-widest' : ''}`}
                            placeholder="••••••••"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-400 ml-1 tracking-wide uppercase text-[10px]">Confirmar</label>
                        <div className="relative group">
                          <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className={`w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3.5 pl-12 pr-12 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all text-lg ${!showConfirmPassword ? 'italic tracking-widest' : ''}`}
                            placeholder="••••••••"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                          >
                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  {step === 2 && (
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 font-bold py-4 rounded-xl transition-all active:scale-[0.98]"
                    >
                      Voltar
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className={`${step === 1 ? 'w-full' : 'flex-[2]'} bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-900/20 transform active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-50 overflow-hidden relative`}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {loading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <>
                          {step === 1 ? 'Próximo Passo' : 'Finalizar Registro'}
                          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] transition-all"></div>
                  </button>
                </div>
              </form>

              <div className="mt-10 pt-8 border-t border-slate-800/50 text-center">
                <p className="text-slate-400 text-sm font-medium tracking-wide">
                  Já possui conta na plataforma?{' '}
                  <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors underline underline-offset-4 decoration-emerald-500/30">
                    Iniciar Sessão
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
