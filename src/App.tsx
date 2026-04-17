import React, { useState, useEffect } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { AnalysisResult } from './components/AnalysisResult';
import { analyzeChartImage, ChartAnalysis } from './services/geminiService';
import { Scan, BarChart3, Info, Github, AlertTriangle, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const INITIAL_DELTA_MISSION: ChartAnalysis = {
    title: "MISSION: DELTA",
    type: "bar",
    data: [
        { label: "NODE_01", value: 420 },
        { label: "NODE_02", value: 380 },
        { label: "NODE_03", value: 890 },
        { label: "NODE_04", value: 540 },
        { label: "NODE_05", value: 610 },
        { label: "NODE_06", value: 290 },
        { label: "NODE_07", value: 460 }
    ],
    insights: [
        "Delta node saturation detected at 89.2% capacity.",
        "Neural vectors indicate primary anomaly focus at NODE_03.",
        "Axiomatic stability confirmed across secondary telemetry channels."
    ],
    summary: "Reconnaissance mission DELTA shows anomalous magnitude at the primary telemetry node. Tactical infiltration recommended for depth extraction.",
    prediction: {
        action: 'BUY',
        confidence: 98,
        reasoning: "Extreme structural support at the Delta vector suggests imminent magnitude expansion. Orbital alignment complete.",
        factors: ["Delta Saturation", "Neural Stability", "Vector Momentum"]
    }
};

export default function App() {
    const [analysis, setAnalysis] = useState<ChartAnalysis | null>(INITIAL_DELTA_MISSION);
    const [isLoading, setIsLoading] = useState(false);
    const [isSimulating, setIsSimulating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isSimulating || !analysis) return;
        let socket: WebSocket | null = null;
        let reconTimeout: NodeJS.Timeout;

        const connect = () => {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}`;
            socket = new WebSocket(wsUrl);

            socket.onmessage = (event) => {
                try {
                    const payload = JSON.parse(event.data);
                    if (payload.type === 'TELEMETRY_DELTA') {
                        setAnalysis(prev => {
                            if (!prev) return null;
                            const lastPoint = prev.data[prev.data.length - 1];
                            const nextNum = parseInt(lastPoint.label.split('_').pop() || '0') + 1;
                            const newVal = Math.max(10, lastPoint.value + payload.valueDelta);
                            const newNode = { label: `NODE_${nextNum.toString().padStart(2, '0')}`, value: newVal };
                            const newData = [...prev.data.slice(1), newNode];
                            return { ...prev, data: newData, prediction: { ...prev.prediction!, confidence: Math.min(100, Math.max(70, prev.prediction!.confidence + payload.confidenceDelta)) } };
                        });
                    }
                } catch (err) {
                    console.error('Neural Link corruption:', err);
                }
            };

            socket.onclose = () => {
                reconTimeout = setTimeout(connect, 3000);
            };
        };

        connect();

        return () => {
            clearTimeout(reconTimeout);
            if (socket) socket.close();
        };
    }, [isSimulating, !!analysis]);

    const handleImageSelected = async (base64: string, mimeType: string) => {
        setIsLoading(true);
        try {
            const result = await analyzeChartImage(base64, mimeType);
            setAnalysis(result);
        } catch (err) {
            setError('System Error: Analysis failed.');
        } finally {
            setIsLoading(false);
        }
    }; 

    const reset = () => setAnalysis(null);

    return (
        <div className="relative min-h-screen flex flex-col font-sans bg-bg text-ink">
            <div className="flex flex-grow">
                <aside className="hidden md:flex w-20 flex-col items-center py-10 gap-12 border-r border-muted sticky top-0 h-screen overflow-hidden">
                    <div className="w-8 h-8 bg-accent rotate-45" />
                    <nav className="flex flex-col gap-12">
                        {['SCANNER', 'PORTFOLIO', 'ALERTS'].map((label) => (
                            <div key={label} className="rail-item-vertical font-mono text-[10px] font-bold uppercase tracking-[0.2em] cursor-pointer hover:text-accent transition-colors">
                                {label}
                            </div>
                        ))}
                    </nav>
                </aside>
                <main className="flex-grow max-w-7xl mx-auto px-6 py-10 w-full relative">
                    <AnimatePresence mode="wait">
                        {!analysis ? (
                            <ImageUploader onImageSelected={handleImageSelected} isLoading={isLoading} />
                        ) : (
                            <AnalysisResult analysis={analysis} isLive={isSimulating} onNewScan={reset} />
                        )}
                    </AnimatePresence>
                </main>
            </div>
            <footer className="h-16 border-t border-muted flex items-center px-10 justify-between bg-[#111112]">
                <button onClick={() => setIsSimulating(!isSimulating)} className={`font-mono text-[10px] font-bold uppercase tracking-[0.2em] ${isSimulating ? 'text-red-500' : 'text-accent'}`}> LIVE_STREAM: {isSimulating ? 'ACTIVE' : 'READY'} </button>
            </footer>
        </div>
    );
}