import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Settings, Play, Sliders, Layers, Server, Code, TrendingUp, Cpu, Plus, ArrowRight } from 'lucide-react';

// --- Données et configurations de démonstration ---

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
}> = ({ layer, onClick, index }) => {
  const isClickable = layer.type === 'Hidden';
  const bgColor = layer.type === 'Input'
    ? 'bg-neural-input'
    : layer.type === 'Output'
    ? 'bg-neural-output'
    : 'bg-neural-hidden hover:bg-neural-hidden/90 cursor-pointer';

  return (
    <div
      className={`p-6 rounded-xl shadow-lg text-white font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-xl
        ${bgColor} ${isClickable ? 'cursor-pointer' : ''} min-w-[140px]`}
      onClick={isClickable ? () => onClick(layer.id) : undefined}
    >
      <div className="text-xs opacity-90 uppercase tracking-wider mb-1">
        {layer.type === 'Hidden' ? `Couche Cachée ${index - 1}` : layer.type === 'Input' ? 'Entrée' : 'Sortie'}
      </div>
      <div className="text-3xl mt-1 mb-2">{layer.units}</div>
      <div className="text-xs opacity-80">
        {layer.activation}
      </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/75 backdrop-blur-sm p-4">
      <div className="bg-card p-8 rounded-2xl shadow-2xl w-full max-w-md border border-border">
        <h2 className="text-2xl font-bold text-card-foreground mb-6 flex items-center">
          <Settings className="mr-3 text-primary" size={24} />
          Configurer la Couche
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-sm font-semibold text-card-foreground mb-2">
              Nombre de Neurones
            </label>
            <input
              type="number"
              value={units}
              onChange={(e) => setUnits(parseInt(e.target.value))}
              min="1"
              required
              className="w-full p-3 border border-input bg-background text-foreground rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-semibold text-card-foreground mb-2">
              Fonction d'Activation
            </label>
            <select
              value={activation}
              onChange={(e) => setActivation(e.target.value)}
              className="w-full p-3 border border-input bg-background text-foreground rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            >
              <option value="ReLU">ReLU</option>
              <option value="Sigmoid">Sigmoid</option>
              <option value="Tanh">Tanh</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-sm font-semibold text-foreground bg-secondary rounded-xl hover:bg-secondary/80 transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-3 text-sm font-semibold text-primary-foreground bg-primary rounded-xl hover:opacity-90 transition-all shadow-md"
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
  let trainButtonIcon = <Play size={20} />;
  let trainButtonColor = 'bg-primary hover:opacity-90';

  if (status === 'Training') {
    trainButtonText = 'Entraînement en cours...';
    trainButtonIcon = <Cpu size={20} className="animate-spin" />;
    trainButtonColor = 'bg-warning cursor-not-allowed';
  } else if (status === 'Done') {
    trainButtonText = 'Entraînement Terminé';
    trainButtonIcon = <TrendingUp size={20} />;
    trainButtonColor = 'bg-success hover:opacity-90';
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {/* En-tête */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-foreground flex items-center mb-2">
          <Layers className="mr-4 text-primary" size={36} />
          Neural Network Builder
        </h1>
        <p className="text-muted-foreground text-lg">
          Construisez et entraînez des réseaux de neurones visuellement, sans coder.
        </p>
      </header>

      {/* Layout principal */}
      <main className="flex flex-col lg:flex-row gap-6">

        {/* Colonne 1: Contrôles */}
        <div className="w-full lg:w-1/4 space-y-6">
          
          {/* Configuration des Données */}
          <div className="bg-card p-6 rounded-2xl shadow-lg border border-border">
            <h2 className="text-lg font-bold text-card-foreground flex items-center mb-5">
              <Server size={20} className="mr-3 text-info" />
              Données
            </h2>
            <label htmlFor="dataset" className="block text-sm font-semibold text-card-foreground mb-2">
              Dataset (Simulé)
            </label>
            <select
              id="dataset"
              value={selectedDataset}
              onChange={(e) => setSelectedDataset(e.target.value as keyof typeof DATASETS)}
              className="w-full p-3 border border-input bg-background text-foreground rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            >
              {Object.entries(DATASETS).map(([key, value]) => (
                <option key={key} value={key}>{value.name}</option>
              ))}
            </select>
            <div className="mt-4 p-3 bg-secondary rounded-lg">
              <p className="text-sm text-secondary-foreground font-semibold">
                Tâche: {DATASETS[selectedDataset].task}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Features: {DATASETS[selectedDataset].features} • Output: {DATASETS[selectedDataset].output}
              </p>
            </div>
          </div>

          {/* Hyperparamètres */}
          <div className="bg-card p-6 rounded-2xl shadow-lg border border-border">
            <h2 className="text-lg font-bold text-card-foreground flex items-center mb-5">
              <Sliders size={20} className="mr-3 text-primary" />
              Hyperparamètres
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-card-foreground mb-2">
                  Taux d'Apprentissage
                </label>
                <input
                  type="number"
                  name="learningRate"
                  value={hyperparameters.learningRate}
                  onChange={handleHyperparameterChange}
                  step="0.0001"
                  min="0"
                  className="w-full p-3 border border-input bg-background text-foreground rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-card-foreground mb-2">
                  Optimiseur
                </label>
                <select
                  name="optimizer"
                  value={hyperparameters.optimizer}
                  onChange={handleHyperparameterChange}
                  className="w-full p-3 border border-input bg-background text-foreground rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                >
                  <option value="Adam">Adam</option>
                  <option value="SGD">SGD</option>
                  <option value="RMSprop">RMSprop</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-card-foreground mb-2">
                  Fonction de Perte
                </label>
                <select
                  name="lossFunction"
                  value={hyperparameters.lossFunction}
                  onChange={handleHyperparameterChange}
                  className="w-full p-3 border border-input bg-background text-foreground rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  disabled={status === 'Training'}
                >
                  <option value="Categorical Crossentropy">Categorical Crossentropy</option>
                  <option value="Binary Crossentropy">Binary Crossentropy</option>
                  <option value="MSE">MSE</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-card-foreground mb-2">
                  Époques
                </label>
                <input
                  type="number"
                  name="epochs"
                  value={hyperparameters.epochs}
                  onChange={handleHyperparameterChange}
                  min="1"
                  className="w-full p-3 border border-input bg-background text-foreground rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
              </div>
            </div>
          </div>

          {/* Bouton d'Action */}
          <button
            onClick={handleTrain}
            disabled={trainButtonDisabled}
            className={`w-full flex items-center justify-center space-x-3 py-4 px-6 font-bold text-white rounded-xl shadow-lg transition-all duration-300 transform hover:scale-[1.02] ${trainButtonColor} disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
          >
            {trainButtonIcon}
            <span>{trainButtonText}</span>
          </button>
        </div>

        {/* Colonne 2: Canvas du Réseau */}
        <div className="w-full lg:w-1/2 p-8 bg-card rounded-2xl shadow-lg border border-border flex flex-col">
          <h2 className="text-xl font-bold text-card-foreground mb-8 flex items-center">
            <Code size={24} className="mr-3 text-primary" />
            Architecture du Réseau
          </h2>

          <div className="flex-grow flex flex-col md:flex-row items-center justify-center md:space-x-6 space-y-6 md:space-y-0 p-6 overflow-x-auto">
            {layers.map((layer, index) => (
              <React.Fragment key={layer.id}>
                <LayerVisualization
                  layer={layer}
                  onClick={handleLayerClick}
                  index={index + 1}
                />
                {index < layers.length - 1 && (
                  <ArrowRight className="text-muted-foreground hidden md:block" size={32} />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="mt-6 flex justify-center">
            <button
              onClick={handleAddLayer}
              className="flex items-center space-x-2 px-6 py-3 text-sm font-bold text-accent-foreground bg-accent rounded-full hover:opacity-90 transition-all shadow-md"
            >
              <Plus size={18} />
              <span>Ajouter Couche Cachée</span>
            </button>
          </div>
        </div>

        {/* Colonne 3: Résultats */}
        <div className="w-full lg:w-1/4 space-y-6">
          <div className="bg-card p-6 rounded-2xl shadow-lg border border-border">
            <h2 className="text-lg font-bold text-card-foreground flex items-center mb-5">
              <TrendingUp size={20} className="mr-3 text-success" />
              Résultats
            </h2>

            {/* Statut */}
            <div className={`p-4 rounded-xl text-sm font-bold mb-5 ${
              status === 'Done' ? 'bg-success/20 text-success' :
              status === 'Training' ? 'bg-warning/20 text-warning' :
              'bg-muted text-muted-foreground'
            }`}>
              Statut: {status === 'Idle' ? 'En attente' : status === 'Training' ? 'Entraînement...' : 'Terminé'}
            </div>
            
            {/* Graphique */}
            {trainingData.length > 0 && (
              <>
                <div className="text-sm font-bold text-card-foreground mb-3">
                  Performance
                </div>
                <div className="w-full h-48 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trainingData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="epoch" 
                        label={{ value: 'Époque', position: 'bottom' }}
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <YAxis 
                        yAxisId="left" 
                        orientation="left" 
                        stroke="hsl(var(--primary))" 
                        domain={[0, 1.0]} 
                      />
                      <YAxis 
                        yAxisId="right" 
                        orientation="right" 
                        stroke="hsl(var(--accent))" 
                        domain={[0, 1.0]} 
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Line 
                        yAxisId="left" 
                        type="monotone" 
                        dataKey="Loss" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2} 
                        name="Perte" 
                        dot={false}
                      />
                      <Line 
                        yAxisId="right" 
                        type="monotone" 
                        dataKey="Accuracy" 
                        stroke="hsl(var(--accent))" 
                        strokeWidth={2} 
                        name="Précision" 
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 p-4 bg-secondary rounded-lg">
                  <p className="text-sm text-secondary-foreground font-semibold">
                    Loss Finale: {trainingData[trainingData.length - 1].Loss.toFixed(4)}
                  </p>
                  <p className="text-sm text-secondary-foreground font-semibold">
                    Accuracy Finale: {trainingData[trainingData.length - 1].Accuracy.toFixed(4)}
                  </p>
                </div>
              </>
            )}

            {trainingData.length === 0 && status !== 'Training' && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  Lancez l'entraînement pour voir les résultats
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
