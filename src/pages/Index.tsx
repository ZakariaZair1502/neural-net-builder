import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Settings, Play, Sliders, Layers, Server, Code, TrendingUp, Cpu, Plus, ArrowRight, Sparkles, Zap, Activity } from 'lucide-react';

// --- Types ---

interface Layer {
  id: number;
  type: 'Input' | 'Hidden' | 'Output';
  units: number;
  activation: string;
}

interface Hyperparameters {
  learningRate: number;
  optimizer: string;
  lossFunction: string;
  epochs: number;
  batchSize: number;
}

interface TrainingDataPoint {
  epoch: number;
  Loss: number;
  Accuracy: number;
}

// --- Données et configurations de démonstration ---

const DATASETS = {
  iris: { name: 'Iris (Classification)', features: 4, output: 3, task: 'Classification' },
  housing: { name: 'Housing (Régression)', features: 13, output: 1, task: 'Régression' },
};

const initialIrisLayers: Layer[] = [
  { id: 1, type: 'Input', units: 4, activation: 'N/A' },
  { id: 2, type: 'Hidden', units: 16, activation: 'ReLU' },
  { id: 3, type: 'Hidden', units: 8, activation: 'ReLU' },
  { id: 4, type: 'Output', units: 3, activation: 'Softmax' },
];

const simulateTrainingData = (epochs: number) => {
  const data = [];
  for (let i = 1; i <= epochs; i++) {
    const loss = 1.0 / (i / 10 + 1) + 0.1 * Math.random();
    const accuracy = 0.5 + 0.4 * (i / epochs) + 0.05 * Math.random();

    data.push({
      epoch: i,
      Loss: Math.max(0.05, loss),
      Accuracy: Math.min(0.99, accuracy),
    });
  }
  return data;
};

// --- Composants ---

const LayerVisualization: React.FC<{
  layer: Layer;
  onClick: (id: number) => void;
  index: number;
  isTraining: boolean;
}> = ({ layer, onClick, index, isTraining }) => {
  const isClickable = layer.type === 'Hidden';
  
  let bgGradient = '';
  let glowColor = '';
  
  if (layer.type === 'Input') {
    bgGradient = 'bg-gradient-to-br from-blue-500 to-blue-600';
    glowColor = 'hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]';
  } else if (layer.type === 'Output') {
    bgGradient = 'bg-gradient-to-br from-orange-500 to-red-500';
    glowColor = 'hover:shadow-[0_0_30px_rgba(249,115,22,0.5)]';
  } else {
    bgGradient = 'bg-gradient-to-br from-emerald-500 to-teal-500';
    glowColor = 'hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]';
  }

  return (
    <div
      className={`relative p-6 rounded-2xl shadow-2xl text-white font-bold transition-all duration-500 transform hover:scale-110 hover:-translate-y-2
        ${bgGradient} ${glowColor} ${isClickable ? 'cursor-pointer' : ''} min-w-[160px] group
        ${isTraining ? 'animate-neural-pulse' : ''}`}
      onClick={isClickable ? () => onClick(layer.id) : undefined}
    >
      {/* Shine effect overlay */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 shimmer-effect animate-shimmer" />
      </div>
      
      <div className="relative z-10">
        <div className="text-xs opacity-90 uppercase tracking-widest mb-2 font-mono flex items-center gap-2">
          {layer.type === 'Input' && <Zap size={14} />}
          {layer.type === 'Hidden' && <Activity size={14} />}
          {layer.type === 'Output' && <Sparkles size={14} />}
          {layer.type === 'Hidden' ? `Couche ${index - 1}` : layer.type === 'Input' ? 'Entrée' : 'Sortie'}
        </div>
        <div className="text-4xl font-bold mt-2 mb-3 font-space">{layer.units}</div>
        <div className="text-xs opacity-80 font-mono bg-black/20 rounded-full px-3 py-1 inline-block">
          {layer.activation}
        </div>
      </div>
      
      {/* Decorative corner elements */}
      <div className="absolute top-2 right-2 w-2 h-2 bg-white/30 rounded-full" />
      <div className="absolute bottom-2 left-2 w-2 h-2 bg-white/30 rounded-full" />
    </div>
  );
};

const ConnectionLine: React.FC<{ isTraining: boolean }> = ({ isTraining }) => {
  return (
    <div className="relative flex items-center">
      {/* Main line */}
      <div className={`h-1 w-12 bg-gradient-to-r from-primary/50 via-accent to-primary/50 rounded-full transition-all duration-500
        ${isTraining ? 'animate-pulse' : ''}`} />
      
      {/* Animated dots */}
      {isTraining && (
        <>
          <div className="absolute left-0 w-2 h-2 bg-primary rounded-full animate-ping" />
          <div className="absolute right-0 w-2 h-2 bg-accent rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
        </>
      )}
    </div>
  );
};

const LayerConfigModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (units: number, activation: string) => void;
  layer: Layer | undefined;
}> = ({ isOpen, onClose, onSave, layer }) => {
  const [units, setUnits] = useState(layer?.units || 10);
  const [activation, setActivation] = useState(layer?.activation || 'ReLU');

  useEffect(() => {
    if (layer) {
      setUnits(layer.units);
      setActivation(layer.activation);
    }
  }, [layer]);

  if (!isOpen || !layer) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(units, activation);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-gradient-to-br from-card to-card/80 p-8 rounded-3xl shadow-2xl w-full max-w-md border border-border/50 transform animate-scale-in">
        <h2 className="text-2xl font-bold text-card-foreground mb-6 flex items-center font-space">
          <Settings className="mr-3 text-primary animate-pulse" size={28} />
          Configuration Couche
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-card-foreground mb-3 uppercase tracking-wider font-mono">
              Nombre de Neurones
            </label>
            <input
              type="number"
              value={units}
              onChange={(e) => setUnits(parseInt(e.target.value))}
              min="1"
              required
              className="w-full p-4 border-2 border-input bg-background text-foreground rounded-xl focus:ring-4 focus:ring-primary/50 focus:border-primary transition-all font-space text-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-card-foreground mb-3 uppercase tracking-wider font-mono">
              Fonction d'Activation
            </label>
            <select
              value={activation}
              onChange={(e) => setActivation(e.target.value)}
              className="w-full p-4 border-2 border-input bg-background text-foreground rounded-xl focus:ring-4 focus:ring-primary/50 focus:border-primary transition-all font-space text-lg"
            >
              <option value="ReLU">ReLU</option>
              <option value="Sigmoid">Sigmoid</option>
              <option value="Tanh">Tanh</option>
            </select>
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-sm font-bold text-foreground bg-secondary rounded-xl hover:bg-secondary/80 transition-all transform hover:scale-105 font-space uppercase tracking-wider"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-3 text-sm font-bold text-primary-foreground bg-gradient-to-r from-primary to-accent rounded-xl hover:shadow-lg hover:shadow-primary/50 transition-all transform hover:scale-105 font-space uppercase tracking-wider"
            >
              Sauvegarder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Composant Principal ---

const Index = () => {
  const [selectedDataset, setSelectedDataset] = useState<keyof typeof DATASETS>('iris');
  const [layers, setLayers] = useState<Layer[]>(initialIrisLayers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLayerId, setEditingLayerId] = useState<number | null>(null);
  const [status, setStatus] = useState<'Idle' | 'Training' | 'Done'>('Idle');
  const [trainingData, setTrainingData] = useState<TrainingDataPoint[]>([]);
  const [hyperparameters, setHyperparameters] = useState<Hyperparameters>({
    learningRate: 0.001,
    optimizer: 'Adam',
    lossFunction: 'Categorical Crossentropy',
    epochs: 50,
    batchSize: 32,
  });

  useEffect(() => {
    const dataset = DATASETS[selectedDataset];
    if (dataset) {
      const newLayers: Layer[] = layers.map(layer => {
        if (layer.type === 'Input') {
          return { ...layer, units: dataset.features };
        }
        if (layer.type === 'Output') {
          const newActivation = dataset.task === 'Classification' ? 'Softmax' : 'Linear';
          const newLoss = dataset.task === 'Classification' ? 'Categorical Crossentropy' : 'MSE';

          setHyperparameters(prev => ({
            ...prev,
            lossFunction: newLoss,
          }));

          return { ...layer, units: dataset.output, activation: newActivation };
        }
        return layer;
      });
      setLayers(newLayers);
    }
  }, [selectedDataset]);

  const handleLayerClick = (id: number) => {
    const layer = layers.find(l => l.id === id);
    if (layer && layer.type === 'Hidden') {
      setEditingLayerId(id);
      setIsModalOpen(true);
    }
  };

  const handleUpdateLayer = (newUnits: number, newActivation: string) => {
    setLayers(prevLayers =>
      prevLayers.map(layer =>
        layer.id === editingLayerId
          ? { ...layer, units: newUnits, activation: newActivation }
          : layer
      )
    );
    setIsModalOpen(false);
    setEditingLayerId(null);
  };

  const handleAddLayer = () => {
    setLayers(prevLayers => {
      const newId = Math.max(...prevLayers.map(l => l.id)) + 1;
      const newHiddenLayer: Layer = { id: newId, type: 'Hidden', units: 10, activation: 'ReLU' };
      
      const outputIndex = prevLayers.findIndex(l => l.type === 'Output');
      const newLayers = [...prevLayers];
      newLayers.splice(outputIndex, 0, newHiddenLayer);
      return newLayers;
    });
  };

  const handleHyperparameterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setHyperparameters(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
    }));
  };

  const handleTrain = () => {
    if (status === 'Training') return;

    setStatus('Training');
    setTrainingData([]);

    const epochs = hyperparameters.epochs;
    let currentEpoch = 0;

    const interval = setInterval(() => {
      currentEpoch += 5;
      if (currentEpoch >= epochs) {
        clearInterval(interval);
        setStatus('Done');
        setTrainingData(simulateTrainingData(epochs));
        return;
      }

      const partialData = simulateTrainingData(currentEpoch);
      setTrainingData(partialData);
    }, 300);
  };

  const editingLayer = layers.find(l => l.id === editingLayerId);

  const trainButtonDisabled = status === 'Training';
  let trainButtonText = 'Entraîner le Modèle';
  let trainButtonIcon = <Play size={22} />;
  let trainButtonStyle = 'bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%] hover:bg-right';

  if (status === 'Training') {
    trainButtonText = 'Entraînement...';
    trainButtonIcon = <Cpu size={22} className="animate-spin" />;
    trainButtonStyle = 'bg-gradient-to-r from-warning to-orange-500 cursor-not-allowed';
  } else if (status === 'Done') {
    trainButtonText = 'Terminé !';
    trainButtonIcon = <Sparkles size={22} />;
    trainButtonStyle = 'bg-gradient-to-r from-success to-emerald-600';
  }

  return (
    <div className="min-h-screen bg-background gradient-mesh p-4 md:p-8 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -z-10" />
      
      {/* En-tête */}
      <header className="mb-10 animate-fade-in">
        <div className="flex items-center gap-4 mb-3">
          <div className="p-3 bg-gradient-to-br from-primary to-accent rounded-2xl shadow-lg animate-float">
            <Layers className="text-white" size={40} />
          </div>
          <div>
            <h1 className="text-5xl font-bold text-foreground font-space bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Neural Network Builder
            </h1>
            <p className="text-muted-foreground text-lg mt-1 font-mono">
              Design • Train • Visualize
            </p>
          </div>
        </div>
      </header>

      {/* Layout principal */}
      <main className="flex flex-col lg:flex-row gap-6">

        {/* Colonne 1: Contrôles */}
        <div className="w-full lg:w-1/4 space-y-6 animate-slide-in-right" style={{ animationDelay: '0.1s' }}>
          
          {/* Configuration des Données */}
          <div className="bg-card/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10">
            <h2 className="text-lg font-bold text-card-foreground flex items-center mb-5 font-space">
              <Server size={22} className="mr-3 text-info" />
              Données
            </h2>
            <label htmlFor="dataset" className="block text-sm font-bold text-card-foreground mb-2 uppercase tracking-wider font-mono">
              Dataset
            </label>
            <select
              id="dataset"
              value={selectedDataset}
              onChange={(e) => setSelectedDataset(e.target.value as keyof typeof DATASETS)}
              className="w-full p-3 border-2 border-input bg-background text-foreground rounded-xl focus:ring-4 focus:ring-primary/50 focus:border-primary transition-all font-space"
            >
              {Object.entries(DATASETS).map(([key, value]) => (
                <option key={key} value={key}>{value.name}</option>
              ))}
            </select>
            <div className="mt-4 p-4 bg-gradient-to-br from-secondary to-secondary/50 rounded-xl border border-border/30">
              <p className="text-sm text-secondary-foreground font-bold font-mono">
                Tâche: {DATASETS[selectedDataset].task}
              </p>
              <p className="text-sm text-muted-foreground mt-2 font-mono">
                Features: <span className="text-accent font-bold">{DATASETS[selectedDataset].features}</span> • 
                Output: <span className="text-accent font-bold">{DATASETS[selectedDataset].output}</span>
              </p>
            </div>
          </div>

          {/* Hyperparamètres */}
          <div className="bg-card/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10">
            <h2 className="text-lg font-bold text-card-foreground flex items-center mb-5 font-space">
              <Sliders size={22} className="mr-3 text-primary" />
              Hyperparamètres
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-card-foreground mb-2 uppercase tracking-wider font-mono">
                  Learning Rate
                </label>
                <input
                  type="number"
                  name="learningRate"
                  value={hyperparameters.learningRate}
                  onChange={handleHyperparameterChange}
                  step="0.0001"
                  min="0"
                  className="w-full p-3 border-2 border-input bg-background text-foreground rounded-xl focus:ring-4 focus:ring-primary/50 focus:border-primary transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-card-foreground mb-2 uppercase tracking-wider font-mono">
                  Optimizer
                </label>
                <select
                  name="optimizer"
                  value={hyperparameters.optimizer}
                  onChange={handleHyperparameterChange}
                  className="w-full p-3 border-2 border-input bg-background text-foreground rounded-xl focus:ring-4 focus:ring-primary/50 focus:border-primary transition-all font-space"
                >
                  <option value="Adam">Adam</option>
                  <option value="SGD">SGD</option>
                  <option value="RMSprop">RMSprop</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-card-foreground mb-2 uppercase tracking-wider font-mono">
                  Loss Function
                </label>
                <select
                  name="lossFunction"
                  value={hyperparameters.lossFunction}
                  onChange={handleHyperparameterChange}
                  className="w-full p-3 border-2 border-input bg-background text-foreground rounded-xl focus:ring-4 focus:ring-primary/50 focus:border-primary transition-all font-space"
                  disabled={status === 'Training'}
                >
                  <option value="Categorical Crossentropy">Categorical Crossentropy</option>
                  <option value="Binary Crossentropy">Binary Crossentropy</option>
                  <option value="MSE">MSE</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-card-foreground mb-2 uppercase tracking-wider font-mono">
                  Epochs
                </label>
                <input
                  type="number"
                  name="epochs"
                  value={hyperparameters.epochs}
                  onChange={handleHyperparameterChange}
                  min="1"
                  className="w-full p-3 border-2 border-input bg-background text-foreground rounded-xl focus:ring-4 focus:ring-primary/50 focus:border-primary transition-all font-mono"
                />
              </div>
            </div>
          </div>

          {/* Bouton d'Action */}
          <button
            onClick={handleTrain}
            disabled={trainButtonDisabled}
            className={`w-full flex items-center justify-center gap-3 py-5 px-6 font-bold text-white rounded-2xl shadow-2xl transition-all duration-500 transform hover:scale-105 ${trainButtonStyle} disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-space uppercase tracking-wider text-lg`}
          >
            {trainButtonIcon}
            <span>{trainButtonText}</span>
          </button>
        </div>

        {/* Colonne 2: Canvas du Réseau */}
        <div className="w-full lg:w-1/2 p-8 bg-card/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-border/50 flex flex-col animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-2xl font-bold text-card-foreground mb-8 flex items-center font-space">
            <Code size={28} className="mr-3 text-primary" />
            Architecture Neuronale
          </h2>

          <div className="flex-grow flex flex-col md:flex-row items-center justify-center md:gap-8 gap-8 p-6 overflow-x-auto">
            {layers.map((layer, index) => (
              <React.Fragment key={layer.id}>
                <LayerVisualization
                  layer={layer}
                  onClick={handleLayerClick}
                  index={index + 1}
                  isTraining={status === 'Training'}
                />
                {index < layers.length - 1 && (
                  <ConnectionLine isTraining={status === 'Training'} />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <button
              onClick={handleAddLayer}
              className="flex items-center gap-3 px-8 py-4 text-sm font-bold text-accent-foreground bg-gradient-to-r from-accent to-emerald-500 rounded-full hover:shadow-xl hover:shadow-accent/50 transition-all transform hover:scale-110 font-space uppercase tracking-wider"
            >
              <Plus size={20} />
              <span>Ajouter Couche</span>
            </button>
          </div>
        </div>

        {/* Colonne 3: Résultats */}
        <div className="w-full lg:w-1/4 space-y-6 animate-slide-in-right" style={{ animationDelay: '0.3s' }}>
          <div className="bg-card/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-border/50 hover:border-success/50 transition-all duration-300">
            <h2 className="text-lg font-bold text-card-foreground flex items-center mb-5 font-space">
              <TrendingUp size={22} className="mr-3 text-success" />
              Résultats
            </h2>

            {/* Statut */}
            <div className={`p-4 rounded-xl text-sm font-bold mb-5 font-mono uppercase tracking-wider text-center transition-all duration-500 ${
              status === 'Done' ? 'bg-gradient-to-r from-success/20 to-emerald-500/20 text-success border-2 border-success/50' :
              status === 'Training' ? 'bg-gradient-to-r from-warning/20 to-orange-500/20 text-warning border-2 border-warning/50 animate-pulse' :
              'bg-muted text-muted-foreground border-2 border-border'
            }`}>
              {status === 'Idle' ? '⚡ En attente' : status === 'Training' ? '🔄 Entraînement...' : '✓ Terminé'}
            </div>
            
            {/* Graphique */}
            {trainingData.length > 0 && (
              <div className="space-y-4">
                <div className="text-sm font-bold text-card-foreground uppercase tracking-wider font-mono flex items-center gap-2">
                  <Activity size={16} className="text-primary" />
                  Performance
                </div>
                <div className="w-full h-52 bg-background/50 rounded-xl p-4 border border-border/30">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trainingData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis 
                        dataKey="epoch" 
                        stroke="hsl(var(--muted-foreground))"
                        style={{ fontSize: '12px', fontFamily: 'JetBrains Mono' }}
                      />
                      <YAxis 
                        yAxisId="left" 
                        orientation="left" 
                        stroke="hsl(var(--primary))" 
                        domain={[0, 1.0]}
                        style={{ fontSize: '12px', fontFamily: 'JetBrains Mono' }}
                      />
                      <YAxis 
                        yAxisId="right" 
                        orientation="right" 
                        stroke="hsl(var(--accent))" 
                        domain={[0, 1.0]}
                        style={{ fontSize: '12px', fontFamily: 'JetBrains Mono' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '2px solid hsl(var(--border))',
                          borderRadius: '12px',
                          fontFamily: 'JetBrains Mono',
                          fontSize: '12px'
                        }}
                      />
                      <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: '11px' }} />
                      <Line 
                        yAxisId="left" 
                        type="monotone" 
                        dataKey="Loss" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3} 
                        name="Loss" 
                        dot={false}
                      />
                      <Line 
                        yAxisId="right" 
                        type="monotone" 
                        dataKey="Accuracy" 
                        stroke="hsl(var(--accent))" 
                        strokeWidth={3} 
                        name="Accuracy" 
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/30">
                    <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1">Loss</p>
                    <p className="text-2xl font-bold text-primary font-mono">
                      {trainingData[trainingData.length - 1].Loss.toFixed(4)}
                    </p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl border border-accent/30">
                    <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1">Accuracy</p>
                    <p className="text-2xl font-bold text-accent font-mono">
                      {trainingData[trainingData.length - 1].Accuracy.toFixed(4)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {trainingData.length === 0 && status !== 'Training' && (
              <div className="text-center py-12 px-4">
                <div className="inline-block p-4 bg-muted/50 rounded-full mb-4">
                  <TrendingUp size={32} className="text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground font-mono">
                  Lancez l'entraînement pour voir les métriques
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modale */}
      <LayerConfigModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleUpdateLayer}
        layer={editingLayer}
      />
    </div>
  );
};

export default Index;
