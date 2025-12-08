import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Move, Type, Eraser, Brush, MousePointer2, Trash2, RotateCw, ZoomIn, ZoomOut, Undo, Redo, Square, Circle as CircleIcon, Wand2, X, ScanLine, Users, ImageMinus } from 'lucide-react';
import { removeBackground } from '@imgly/background-removal';
import CharacterPicker from './CharacterPicker';

const CompositionCanvas = ({ width = 800, height = 450, onUpdate, initialImage }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const drawingCanvasRef = useRef(null); // Offscreen canvas for raster drawings

    // State
    const [layers, setLayers] = useState([]); // { id, type: 'image'|'text'|'shape', x, y, width, height, rotation, scale, content, img, maskCanvas, fontSize, color, shapeType }
    const [selectedLayerId, setSelectedLayerId] = useState(null);
    const [tool, setTool] = useState('select'); // select, brush, eraser, text, rect, circle, magic-wand, lasso
    const [brushSize, setBrushSize] = useState(10);
    const [brushColor, setBrushColor] = useState('#ff0000');
    const [isProcessing, setIsProcessing] = useState(false);

    // History
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Interaction State
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [resizeHandle, setResizeHandle] = useState(null); // 'tl', 'tr', 'bl', 'br'
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [initialLayerState, setInitialLayerState] = useState(null); // For resizing
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPath, setCurrentPath] = useState([]);
    const [showCharPicker, setShowCharPicker] = useState(false);

    // Initialize drawing canvas
    useEffect(() => {
        if (!drawingCanvasRef.current) {
            const c = document.createElement('canvas');
            c.width = width;
            c.height = height;
            drawingCanvasRef.current = c;
        }
    }, [width, height]);

    // Initialize with background image
    useEffect(() => {
        if (initialImage) {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = initialImage;
            img.onload = () => {
                const newLayer = {
                    id: 'bg-' + Date.now(),
                    type: 'image',
                    img: img,
                    x: 0,
                    y: 0,
                    width: width,
                    height: height,
                    rotation: 0,
                    scale: 1,
                    maskCanvas: createMaskCanvas(width, height)
                };
                setLayers([newLayer]);
                saveHistoryRef([newLayer]);
            };
        }
    }, [initialImage]);

    const createMaskCanvas = (w, h) => {
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        return c;
    };

    // History Management
    const saveHistoryRef = (currentLayers) => {
        const snapshot = currentLayers.map(l => ({ ...l })); // Shallow clone
        const drawingData = drawingCanvasRef.current ? drawingCanvasRef.current.toDataURL() : null;

        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push({ layers: snapshot, drawingData });
        if (newHistory.length > 20) newHistory.shift();

        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            const prevState = history[historyIndex - 1];
            setHistoryIndex(historyIndex - 1);
            restoreStateRef(prevState);
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            const nextState = history[historyIndex + 1];
            setHistoryIndex(historyIndex + 1);
            restoreStateRef(nextState);
        }
    };

    const restoreStateRef = (state) => {
        setLayers(state.layers);
        if (state.drawingData) {
            const img = new Image();
            img.onload = () => {
                const ctx = drawingCanvasRef.current.getContext('2d');
                ctx.clearRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0);
                exportCanvas();
            };
            img.src = state.drawingData;
        }
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedLayerId && tool === 'select') {
                    handleDeleteLayer();
                }
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                if (e.shiftKey) handleRedo();
                else handleUndo();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedLayerId, tool, historyIndex]);

    // Render Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw Layers
        layers.forEach(layer => {
            ctx.save();

            if (layer.type === 'image' && layer.img) {
                // Image rendering
                const tempC = document.createElement('canvas');
                tempC.width = layer.width;
                tempC.height = layer.height;
                const tempCtx = tempC.getContext('2d');
                tempCtx.drawImage(layer.img, 0, 0, layer.width, layer.height);

                if (layer.maskCanvas) {
                    tempCtx.globalCompositeOperation = 'destination-out';
                    tempCtx.drawImage(layer.maskCanvas, 0, 0, layer.width, layer.height);
                }

                ctx.drawImage(tempC, layer.x, layer.y, layer.width, layer.height);

            } else if (layer.type === 'text') {
                // Text Rendering
                const words = layer.content.split(' ');
                let currentX = layer.x;
                const fontSize = layer.fontSize || 24;
                ctx.font = `${fontSize}px Arial`;
                ctx.textBaseline = 'top';

                words.forEach((word, i) => {
                    const isMention = word.startsWith('@');
                    ctx.fillStyle = isMention ? '#ff982b' : (layer.color || '#ffffff');
                    ctx.font = isMention ? `bold ${fontSize}px Arial` : `${fontSize}px Arial`;

                    ctx.fillText(word, currentX, layer.y);
                    const metrics = ctx.measureText(word + ' ');
                    currentX += metrics.width;
                });

            } else if (layer.type === 'shape') {
                // Shape Rendering
                ctx.fillStyle = layer.color;
                if (layer.shapeType === 'rect') {
                    ctx.fillRect(layer.x, layer.y, layer.width, layer.height);
                } else if (layer.shapeType === 'circle') {
                    ctx.beginPath();
                    ctx.arc(layer.x + layer.width / 2, layer.y + layer.height / 2, layer.width / 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Selection Box & Handles
            if (selectedLayerId === layer.id) {
                ctx.strokeStyle = '#0071e3';
                ctx.lineWidth = 2;

                let boxX = layer.x;
                let boxY = layer.y;
                let boxW = layer.width;
                let boxH = layer.height;

                if (layer.type === 'text') {
                    // Approximate text box
                    const fontSize = layer.fontSize || 24;
                    ctx.font = `${fontSize}px Arial`;
                    const words = layer.content.split(' ');
                    let totalWidth = 0;
                    words.forEach(word => {
                        const isMention = word.startsWith('@');
                        ctx.font = isMention ? `bold ${fontSize}px Arial` : `${fontSize}px Arial`;
                        totalWidth += ctx.measureText(word + ' ').width;
                    });
                    boxW = totalWidth;
                    boxH = fontSize;
                }

                ctx.strokeRect(boxX, boxY, boxW, boxH);

                // Draw Resize Handles (Corners)
                const handleSize = 8;
                ctx.fillStyle = 'white';
                ctx.strokeStyle = '#0071e3';
                ctx.lineWidth = 1;

                const handles = [
                    { x: boxX - handleSize / 2, y: boxY - handleSize / 2 }, // TL
                    { x: boxX + boxW - handleSize / 2, y: boxY - handleSize / 2 }, // TR
                    { x: boxX - handleSize / 2, y: boxY + boxH - handleSize / 2 }, // BL
                    { x: boxX + boxW - handleSize / 2, y: boxY + boxH - handleSize / 2 } // BR
                ];

                handles.forEach(h => {
                    ctx.fillRect(h.x, h.y, handleSize, handleSize);
                    ctx.strokeRect(h.x, h.y, handleSize, handleSize);
                });

                // Draw X button for text (legacy support, maybe keep?)
                if (layer.type === 'text') {
                    const btnX = boxX + boxW + 14;
                    const btnY = boxY - 4;
                    ctx.fillStyle = '#ff3b30';
                    ctx.beginPath();
                    ctx.arc(btnX, btnY, 8, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = 'white';
                    ctx.font = 'bold 10px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('X', btnX, btnY);
                    ctx.textAlign = 'start';
                    ctx.textBaseline = 'top';
                }
            }

            ctx.restore();
        });

        // Draw Drawing Canvas (Raster)
        if (drawingCanvasRef.current) {
            ctx.drawImage(drawingCanvasRef.current, 0, 0);
        }

        // Draw Current Path (Brush Preview)
        if (isDrawing && currentPath.length > 1) {
            ctx.beginPath();
            ctx.moveTo(currentPath[0].x, currentPath[0].y);
            for (let i = 1; i < currentPath.length; i++) {
                ctx.lineTo(currentPath[i].x, currentPath[i].y);
            }
            ctx.strokeStyle = tool === 'eraser' ? 'rgba(255,255,255,0.5)' : (tool === 'lasso' ? '#ff982b' : brushColor);
            ctx.lineWidth = tool === 'lasso' ? 2 : brushSize;
            if (tool === 'lasso') {
                ctx.setLineDash([5, 5]);
                ctx.shadowColor = '#ff982b';
                ctx.shadowBlur = 10;
            }
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.shadowBlur = 0;
        }

    }, [layers, selectedLayerId, tool, currentPath, historyIndex]);

    // Interaction Handlers
    const getMousePos = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const scaleX = canvasRef.current.width / rect.width;
        const scaleY = canvasRef.current.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    };

    const getLayerBox = (layer) => {
        if (layer.type === 'text') {
            const ctx = canvasRef.current.getContext('2d');
            const fontSize = layer.fontSize || 24;
            ctx.font = `${fontSize}px Arial`;
            const words = layer.content.split(' ');
            let totalWidth = 0;
            words.forEach(word => {
                const isMention = word.startsWith('@');
                ctx.font = isMention ? `bold ${fontSize}px Arial` : `${fontSize}px Arial`;
                totalWidth += ctx.measureText(word + ' ').width;
            });
            return { x: layer.x, y: layer.y, width: totalWidth, height: fontSize };
        }
        return { x: layer.x, y: layer.y, width: layer.width, height: layer.height };
    };

    const handleMouseDown = (e) => {
        const pos = getMousePos(e);

        // 1. Check Resize Handles if layer selected
        if (selectedLayerId) {
            const layer = layers.find(l => l.id === selectedLayerId);
            if (layer) {
                const box = getLayerBox(layer);
                const handleSize = 10; // slightly larger hit area

                // TL
                if (pos.x >= box.x - handleSize && pos.x <= box.x + handleSize && pos.y >= box.y - handleSize && pos.y <= box.y + handleSize) {
                    setIsResizing(true); setResizeHandle('tl'); setDragStart(pos); setInitialLayerState({ ...layer }); return;
                }
                // TR
                if (pos.x >= box.x + box.width - handleSize && pos.x <= box.x + box.width + handleSize && pos.y >= box.y - handleSize && pos.y <= box.y + handleSize) {
                    setIsResizing(true); setResizeHandle('tr'); setDragStart(pos); setInitialLayerState({ ...layer }); return;
                }
                // BL
                if (pos.x >= box.x - handleSize && pos.x <= box.x + handleSize && pos.y >= box.y + box.height - handleSize && pos.y <= box.y + box.height + handleSize) {
                    setIsResizing(true); setResizeHandle('bl'); setDragStart(pos); setInitialLayerState({ ...layer }); return;
                }
                // BR
                if (pos.x >= box.x + box.width - handleSize && pos.x <= box.x + box.width + handleSize && pos.y >= box.y + box.height - handleSize && pos.y <= box.y + box.height + handleSize) {
                    setIsResizing(true); setResizeHandle('br'); setDragStart(pos); setInitialLayerState({ ...layer }); return;
                }

                // Check Text X Button
                if (layer.type === 'text') {
                    const btnX = box.x + box.width + 14;
                    const btnY = box.y - 4;
                    const dist = Math.sqrt(Math.pow(pos.x - btnX, 2) + Math.pow(pos.y - btnY, 2));
                    if (dist <= 10) {
                        handleDeleteLayer();
                        return;
                    }
                }
            }
        }

        if (tool === 'select') {
            // Hit detection (reverse order)
            let hit = null;
            for (let i = layers.length - 1; i >= 0; i--) {
                const l = layers[i];
                const box = getLayerBox(l);
                if (pos.x >= box.x && pos.x <= box.x + box.width && pos.y >= box.y && pos.y <= box.y + box.height) {
                    hit = l.id;
                    break;
                }
            }
            setSelectedLayerId(hit);
            if (hit) {
                setIsDragging(true);
                setDragStart(pos);
            }
        } else if (tool === 'brush' || tool === 'eraser' || tool === 'lasso') {
            setIsDrawing(true);
            setCurrentPath([pos]);
        } else if (tool === 'text') {
            const text = prompt("Enter text (use @name for characters):");
            if (text) {
                const newLayer = {
                    id: 'txt-' + Date.now(),
                    type: 'text',
                    content: text,
                    x: pos.x,
                    y: pos.y,
                    fontSize: 24,
                    color: brushColor
                };
                const newLayers = [...layers, newLayer];
                setLayers(newLayers);
                saveHistoryRef(newLayers);
                setSelectedLayerId(newLayer.id);
                setTool('select');
            }
        } else if (tool === 'rect' || tool === 'circle') {
            const newLayer = {
                id: 'shp-' + Date.now(),
                type: 'shape',
                shapeType: tool,
                x: pos.x - 50,
                y: pos.y - 50,
                width: 100,
                height: 100,
                color: brushColor,
                rotation: 0,
                scale: 1
            };
            const newLayers = [...layers, newLayer];
            setLayers(newLayers);
            saveHistoryRef(newLayers);
            setSelectedLayerId(newLayer.id);
            setTool('select');
        } else if (tool === 'magic-wand') {
            let hit = null;
            for (let i = layers.length - 1; i >= 0; i--) {
                const l = layers[i];
                if (l.type === 'image' && pos.x >= l.x && pos.x <= l.x + l.width && pos.y >= l.y && pos.y <= l.y + l.height) {
                    hit = l.id;
                    break;
                }
            }
            if (hit) {
                setSelectedLayerId(hit);
                handleRemoveBackground(hit);
            }
        }
    };

    const handleMouseMove = (e) => {
        const pos = getMousePos(e);

        // Cursor Updates
        if (!isResizing && !isDragging && !isDrawing) {
            if (tool === 'select' && selectedLayerId) {
                const layer = layers.find(l => l.id === selectedLayerId);
                if (layer) {
                    const box = getLayerBox(layer);
                    const handleSize = 10;

                    // TL
                    if (pos.x >= box.x - handleSize && pos.x <= box.x + handleSize && pos.y >= box.y - handleSize && pos.y <= box.y + handleSize) {
                        canvasRef.current.style.cursor = 'nw-resize';
                    }
                    // TR
                    else if (pos.x >= box.x + box.width - handleSize && pos.x <= box.x + box.width + handleSize && pos.y >= box.y - handleSize && pos.y <= box.y + handleSize) {
                        canvasRef.current.style.cursor = 'ne-resize';
                    }
                    // BL
                    else if (pos.x >= box.x - handleSize && pos.x <= box.x + handleSize && pos.y >= box.y + box.height - handleSize && pos.y <= box.y + box.height + handleSize) {
                        canvasRef.current.style.cursor = 'sw-resize';
                    }
                    // BR
                    else if (pos.x >= box.x + box.width - handleSize && pos.x <= box.x + box.width + handleSize && pos.y >= box.y + box.height - handleSize && pos.y <= box.y + box.height + handleSize) {
                        canvasRef.current.style.cursor = 'se-resize';
                    }
                    // Body
                    else if (pos.x >= box.x && pos.x <= box.x + box.width && pos.y >= box.y && pos.y <= box.y + box.height) {
                        canvasRef.current.style.cursor = 'move';
                    } else {
                        canvasRef.current.style.cursor = 'default';
                    }
                } else {
                    canvasRef.current.style.cursor = 'default';
                }
            } else if (tool === 'select') {
                // Check if hovering over any layer
                let hit = false;
                for (let i = layers.length - 1; i >= 0; i--) {
                    const l = layers[i];
                    const box = getLayerBox(l);
                    if (pos.x >= box.x && pos.x <= box.x + box.width && pos.y >= box.y && pos.y <= box.y + box.height) {
                        hit = true;
                        break;
                    }
                }
                canvasRef.current.style.cursor = hit ? 'move' : 'default';
            } else {
                canvasRef.current.style.cursor = 'crosshair';
            }
        }

        if (isResizing && selectedLayerId && initialLayerState) {
            const dx = pos.x - dragStart.x;
            const dy = pos.y - dragStart.y;
            const l = initialLayerState;

            let newX = l.x;
            let newY = l.y;
            let newW = l.width;
            let newH = l.height;

            if (resizeHandle === 'br') {
                newW = l.width + dx;
                newH = l.height + dy;
            } else if (resizeHandle === 'bl') {
                newX = l.x + dx;
                newW = l.width - dx;
                newH = l.height + dy;
            } else if (resizeHandle === 'tr') {
                newY = l.y + dy;
                newW = l.width + dx;
                newH = l.height - dy;
            } else if (resizeHandle === 'tl') {
                newX = l.x + dx;
                newY = l.y + dy;
                newW = l.width - dx;
                newH = l.height - dy;
            }

            // Min size check
            if (newW < 10) newW = 10;
            if (newH < 10) newH = 10;

            setLayers(layers.map(layer => layer.id === selectedLayerId ? { ...layer, x: newX, y: newY, width: newW, height: newH } : layer));
            return;
        }

        if (isDragging && selectedLayerId) {
            const dx = pos.x - dragStart.x;
            const dy = pos.y - dragStart.y;
            setLayers(layers.map(l => l.id === selectedLayerId ? { ...l, x: l.x + dx, y: l.y + dy } : l));
            setDragStart(pos);
        }

        if (isDrawing) {
            setCurrentPath(prev => [...prev, pos]);

            if (tool === 'eraser') {
                if (selectedLayerId) {
                    // Mask Eraser Mode
                    setLayers(layers.map(l => {
                        if (l.id === selectedLayerId && l.maskCanvas) {
                            const mCtx = l.maskCanvas.getContext('2d');
                            const lx = pos.x - l.x;
                            const ly = pos.y - l.y;
                            mCtx.beginPath();
                            mCtx.arc(lx, ly, brushSize / 2, 0, Math.PI * 2);
                            mCtx.fillStyle = 'black';
                            mCtx.fill();
                            return { ...l };
                        }
                        return l;
                    }));
                } else {
                    // Global Eraser (erases drawings)
                    const ctx = drawingCanvasRef.current.getContext('2d');
                    ctx.globalCompositeOperation = 'destination-out';
                    ctx.beginPath();
                    ctx.arc(pos.x, pos.y, brushSize / 2, 0, Math.PI * 2);
                    ctx.fillStyle = 'black';
                    ctx.fill();
                    ctx.globalCompositeOperation = 'source-over';
                }
            }
        }
    };

    const handleMouseUp = () => {
        if (isDragging || isResizing) {
            saveHistoryRef(layers);
        }

        if (isDrawing) {
            if (tool === 'brush') {
                const ctx = drawingCanvasRef.current.getContext('2d');
                ctx.beginPath();
                ctx.moveTo(currentPath[0].x, currentPath[0].y);
                for (let i = 1; i < currentPath.length; i++) {
                    ctx.lineTo(currentPath[i].x, currentPath[i].y);
                }
                ctx.strokeStyle = brushColor;
                ctx.lineWidth = brushSize;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.stroke();

                saveHistoryRef(layers);
            } else if (tool === 'eraser') {
                saveHistoryRef(layers);
            } else if (tool === 'lasso') {
                if (currentPath.length > 2) {
                    handleSmartSelect(currentPath);
                }
            }
        }

        setIsDragging(false);
        setIsResizing(false);
        setIsDrawing(false);
        setCurrentPath([]);
        exportCanvas();
    };

    const handleDeleteLayer = () => {
        if (selectedLayerId) {
            const newLayers = layers.filter(l => l.id !== selectedLayerId);
            setLayers(newLayers);
            setSelectedLayerId(null);
            saveHistoryRef(newLayers);
            exportCanvas();
        } else {
            const ctx = drawingCanvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, width, height);
            saveHistoryRef(layers);
            exportCanvas();
        }
    };

    const handleRemoveBackground = async (layerId) => {
        const layer = layers.find(l => l.id === layerId);
        if (!layer || layer.type !== 'image') return;

        setIsProcessing(true);
        try {
            // Use src if available, otherwise fallback to blob/object
            const input = layer.img.src || layer.img;
            const blob = await removeBackground(input);
            const url = URL.createObjectURL(blob);
            const newImg = new Image();
            newImg.onload = () => {
                const newLayers = layers.map(l => l.id === layerId ? { ...l, img: newImg, maskCanvas: createMaskCanvas(l.width, l.height) } : l);
                setLayers(newLayers);
                saveHistoryRef(newLayers);
                setIsProcessing(false);
                exportCanvas();
            };
            newImg.src = url;
        } catch (err) {
            console.error("Background removal failed", err);
            alert("Failed to remove background. " + err.message);
            setIsProcessing(false);
        }
    };

    const handleSmartSelect = async (path) => {
        setIsProcessing(true);
        try {
            // 1. Calculate Bounding Box
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            path.forEach(p => {
                minX = Math.min(minX, p.x);
                minY = Math.min(minY, p.y);
                maxX = Math.max(maxX, p.x);
                maxY = Math.max(maxY, p.y);
            });
            const width = maxX - minX;
            const height = maxY - minY;

            if (width < 5 || height < 5) {
                setIsProcessing(false);
                return;
            }

            // 2. Create temporary canvas for the crop (Sample All Layers)
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = width;
            tempCanvas.height = height;
            const ctx = tempCanvas.getContext('2d');

            // 3. Render all layers onto a full-size temp canvas first to get the composite
            const fullCanvas = document.createElement('canvas');
            fullCanvas.width = canvasRef.current.width;
            fullCanvas.height = canvasRef.current.height;
            const fullCtx = fullCanvas.getContext('2d');

            // Draw all layers (images, text, shapes)
            layers.forEach(layer => {
                fullCtx.save();
                if (layer.type === 'image' && layer.img) {
                    const tempC = document.createElement('canvas');
                    tempC.width = layer.width;
                    tempC.height = layer.height;
                    const tempCtx = tempC.getContext('2d');
                    tempCtx.drawImage(layer.img, 0, 0, layer.width, layer.height);
                    if (layer.maskCanvas) {
                        tempCtx.globalCompositeOperation = 'destination-out';
                        tempCtx.drawImage(layer.maskCanvas, 0, 0, layer.width, layer.height);
                    }
                    fullCtx.drawImage(tempC, layer.x, layer.y, layer.width, layer.height);
                } else if (layer.type === 'text') {
                    const words = layer.content.split(' ');
                    let currentX = layer.x;
                    const fontSize = layer.fontSize || 24;
                    fullCtx.font = `${fontSize}px Arial`;
                    fullCtx.textBaseline = 'top';
                    words.forEach((word) => {
                        const isMention = word.startsWith('@');
                        fullCtx.fillStyle = isMention ? '#ff982b' : (layer.color || '#ffffff');
                        fullCtx.font = isMention ? `bold ${fontSize}px Arial` : `${fontSize}px Arial`;
                        fullCtx.fillText(word, currentX, layer.y);
                        const metrics = fullCtx.measureText(word + ' ');
                        currentX += metrics.width;
                    });
                } else if (layer.type === 'shape') {
                    fullCtx.fillStyle = layer.color;
                    if (layer.shapeType === 'rect') {
                        fullCtx.fillRect(layer.x, layer.y, layer.width, layer.height);
                    } else if (layer.shapeType === 'circle') {
                        fullCtx.beginPath();
                        fullCtx.arc(layer.x + layer.width / 2, layer.y + layer.height / 2, layer.width / 2, 0, Math.PI * 2);
                        fullCtx.fill();
                    }
                }
                fullCtx.restore();
            });

            // Draw drawings
            if (drawingCanvasRef.current) {
                fullCtx.drawImage(drawingCanvasRef.current, 0, 0);
            }

            // 4. Crop the specific area from the full composite
            ctx.drawImage(fullCanvas, minX, minY, width, height, 0, 0, width, height);

            // 5. Run removeBackground on the crop
            // Convert to blob first to ensure compatibility
            const blobInput = await new Promise(resolve => tempCanvas.toBlob(resolve, 'image/png'));

            if (!blobInput) throw new Error("Failed to create image blob from selection");

            // Configure to use remote assets to avoid local serving issues
            const config = {
                progress: (key, current, total) => {
                    console.log(`Downloading ${key}: ${current} of ${total}`);
                },
                debug: true
            };

            const blob = await removeBackground(blobInput, config);
            const url = URL.createObjectURL(blob);
            const newImg = new Image();
            newImg.onload = () => {
                const newLayer = {
                    id: 'smart-' + Date.now(),
                    type: 'image',
                    img: newImg,
                    x: minX,
                    y: minY,
                    width: width,
                    height: height,
                    rotation: 0,
                    scale: 1,
                    maskCanvas: createMaskCanvas(width, height)
                };
                const newLayers = [...layers, newLayer];
                setLayers(newLayers);
                setSelectedLayerId(newLayer.id); // Auto-select the new object
                saveHistoryRef(newLayers);
                setIsProcessing(false);
                exportCanvas();
            };
            newImg.onerror = (e) => {
                console.error("Failed to load processed image", e);
                setIsProcessing(false);
            };
            newImg.src = url;

        } catch (err) {
            console.error("Smart select failed", err);
            // Detailed error for the user
            let msg = err.message;
            if (msg.includes("iterable")) msg = "AI Model failed to load. Please check your internet connection.";
            alert(`Smart select failed: ${msg}`);
            setIsProcessing(false);
        }
    };

    const handleAddCharacterImage = (imgUrl) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imgUrl;
        img.onload = () => {
            let w = img.width;
            let h = img.height;
            // Scale down if too big
            if (w > 400) {
                const ratio = 400 / w;
                w = 400;
                h = h * ratio;
            }

            const newLayer = {
                id: 'char-' + Date.now(),
                type: 'image',
                img: img,
                x: (width - w) / 2,
                y: (height - h) / 2,
                width: w,
                height: h,
                rotation: 0,
                scale: 1,
                maskCanvas: createMaskCanvas(w, h)
            };
            const newLayers = [...layers, newLayer];
            setLayers(newLayers);
            saveHistoryRef(newLayers);
            setSelectedLayerId(newLayer.id);
            setShowCharPicker(false);
            setTool('select');
            exportCanvas();
        };
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const imageUrl = e.dataTransfer.getData('text/plain');
        if (imageUrl) {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = imageUrl;
            img.onload = () => {
                let w = img.width;
                let h = img.height;
                if (w > 300) {
                    const ratio = 300 / w;
                    w = 300;
                    h = h * ratio;
                }
                const newLayer = {
                    id: 'img-' + Date.now(),
                    type: 'image',
                    img: img,
                    x: e.nativeEvent.offsetX - w / 2,
                    y: e.nativeEvent.offsetY - h / 2,
                    width: w,
                    height: h,
                    rotation: 0,
                    scale: 1,
                    maskCanvas: createMaskCanvas(w, h)
                };
                const newLayers = [...layers, newLayer];
                setLayers(newLayers);
                setSelectedLayerId(newLayer.id);
                saveHistoryRef(newLayers);
                exportCanvas();
            };
        }
    };

    const exportCanvas = () => {
        if (canvasRef.current && onUpdate) {
            onUpdate(canvasRef.current.toDataURL());
        }
    };

    return (
        <div className="composition-canvas-root" style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
            {/* Toolbar */}
            <div className="canvas-toolbar" style={{ display: 'flex', gap: '8px', padding: '8px', background: '#2a2a2a', borderBottom: '1px solid #333', flexWrap: 'wrap' }}>
                <button className={`tool-btn ${tool === 'select' ? 'active' : ''}`} onClick={() => setTool('select')} title="Select & Move"><MousePointer2 size={20} /></button>
                <button className={`tool-btn ${tool === 'lasso' ? 'active' : ''}`} onClick={() => setTool('lasso')} title="Smart Object Select (AI)"><ScanLine size={20} /></button>
                <button className={`tool-btn ${tool === 'brush' ? 'active' : ''}`} onClick={() => setTool('brush')} title="Brush"><Brush size={20} /></button>
                <button className={`tool-btn ${tool === 'eraser' ? 'active' : ''}`} onClick={() => setTool('eraser')} title="Eraser (Mask/Drawing)"><Eraser size={20} /></button>
                <button className={`tool-btn ${tool === 'text' ? 'active' : ''}`} onClick={() => setTool('text')} title="Text"><Type size={20} /></button>
                <button className={`tool-btn ${tool === 'rect' ? 'active' : ''}`} onClick={() => setTool('rect')} title="Rectangle"><Square size={20} /></button>
                <button className={`tool-btn ${tool === 'circle' ? 'active' : ''}`} onClick={() => setTool('circle')} title="Circle"><CircleIcon size={20} /></button>
                <button className={`tool-btn ${tool === 'magic-wand' ? 'active' : ''}`} onClick={() => setTool('magic-wand')} title="AI Remove Background (Select image first)"><ImageMinus size={20} /></button>
                <button className="tool-btn" onClick={() => setShowCharPicker(true)} title="Add Character"><Users size={20} /></button>

                <div style={{ width: '1px', background: '#444', margin: '0 8px' }}></div>

                <button className="tool-btn" onClick={() => handleUndo()} disabled={historyIndex <= 0} title="Undo"><Undo size={20} /></button>
                <button className="tool-btn" onClick={() => handleRedo()} disabled={historyIndex >= history.length - 1} title="Redo"><Redo size={20} /></button>

                <div style={{ width: '1px', background: '#444', margin: '0 8px' }}></div>

                <input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} style={{ width: '30px', height: '30px', border: 'none', padding: 0, background: 'none' }} />
                <input type="range" min="1" max="50" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} style={{ width: '80px' }} />

                <div style={{ flex: 1 }}></div>

                <button className="tool-btn" onClick={handleDeleteLayer} title="Delete Selected / Clear Drawings"><Trash2 size={20} /></button>
            </div>

            {/* Canvas Area */}
            <div className="canvas-workspace" ref={containerRef} style={{ flex: 1, background: '#1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }} onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
                <canvas ref={canvasRef} width={width} height={height} style={{ background: '#ffffff', boxShadow: '0 0 20px rgba(0,0,0,0.5)', cursor: tool === 'select' ? 'move' : 'crosshair' }} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} />

                {/* Loading Overlay */}
                {isProcessing && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexDirection: 'column', gap: '10px' }}>
                        <div className="spinner-small"></div>
                        <span>Processing AI...</span>
                    </div>
                )}

                {layers.length === 0 && !drawingCanvasRef.current && (
                    <div style={{ position: 'absolute', pointerEvents: 'none', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
                        <p>Drag & Drop images here</p>
                        <p>Use Brush to sketch</p>
                    </div>
                )}
            </div>
            {/* Character Picker Modal */}
            <CharacterPicker
                isOpen={showCharPicker}
                onClose={() => setShowCharPicker(false)}
                onSelectImage={handleAddCharacterImage}
            />
        </div>
    );
};

export default CompositionCanvas;
