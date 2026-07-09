"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, Trash2, X, Move, Link, Sidebar as SidebarIcon, FileText, LayoutDashboard, BrainCircuit } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { TranslationKey } from "../../constants/translations";
import { useLanguage } from '@/contexts/LanguageContext';

// Global cache to prevent race conditions during rapid close/reopen
// We use window.ckNotesCache so it can be preloaded by MainMenu.

interface Node {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  title?: string;
  content: string;
}

interface Edge {
  id: string;
  source: string;
  target: string;
  sourcePort?: 'top' | 'right' | 'bottom' | 'left';
  targetPort?: 'top' | 'right' | 'bottom' | 'left';
}

interface Workspace {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
  updatedAt: number;
}

type Port = 'top' | 'right' | 'bottom' | 'left';

const getPortPos = (node: Node, port: Port = 'right') => {
  switch (port) {
    case 'top': return { x: node.x + node.width / 2, y: node.y };
    case 'bottom': return { x: node.x + node.width / 2, y: node.y + node.height };
    case 'left': return { x: node.x, y: node.y + node.height / 2 };
    case 'right': return { x: node.x + node.width, y: node.y + node.height / 2 };
  }
};

const getOrthogonalPath = (x1: number, y1: number, p1: string, x2: number, y2: number, p2: string) => {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  
  let points = [];
  if ((p1 === 'right' || p1 === 'left') && (p2 === 'left' || p2 === 'right')) {
    points = [
      {x: x1, y: y1},
      {x: midX, y: y1},
      {x: midX, y: y2},
      {x: x2, y: y2}
    ];
  } else if ((p1 === 'top' || p1 === 'bottom') && (p2 === 'top' || p2 === 'bottom')) {
    points = [
      {x: x1, y: y1},
      {x: x1, y: midY},
      {x: x2, y: midY},
      {x: x2, y: y2}
    ];
  } else {
    if (p1 === 'right' || p1 === 'left') {
      points = [
        {x: x1, y: y1},
        {x: x2, y: y1},
        {x: x2, y: y2}
      ];
    } else {
      points = [
        {x: x1, y: y1},
        {x: x1, y: y2},
        {x: x2, y: y2}
      ];
    }
  }

  const radius = 15;
  if (points.length < 2) return '';
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];
    
    const dx1 = prev.x - curr.x;
    const dy1 = prev.y - curr.y;
    const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1) || 1;
    
    const dx2 = next.x - curr.x;
    const dy2 = next.y - curr.y;
    const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) || 1;
    
    const r = Math.min(radius, len1 / 2, len2 / 2);
    
    if (r <= 0) {
      path += ` L ${curr.x} ${curr.y}`;
      continue;
    }
    
    const p1_arc = { x: curr.x + (dx1 / len1) * r, y: curr.y + (dy1 / len1) * r };
    const p2_arc = { x: curr.x + (dx2 / len2) * r, y: curr.y + (dy2 / len2) * r };
    
    path += ` L ${p1_arc.x} ${p1_arc.y}`;
    path += ` Q ${curr.x} ${curr.y} ${p2_arc.x} ${p2_arc.y}`;
  }
  path += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
  
  return path;
};

const getOrthogonalMidpoint = (x1: number, y1: number, p1: string, x2: number, y2: number, p2: string) => {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  
  if ((p1 === 'right' || p1 === 'left') && (p2 === 'left' || p2 === 'right')) {
    return { x: midX, y: midY };
  } else if ((p1 === 'top' || p1 === 'bottom') && (p2 === 'top' || p2 === 'bottom')) {
    return { x: midX, y: midY };
  } else {
    if (p1 === 'right' || p1 === 'left') {
      return { x: x2, y: y1 }; // Corner of the L-shape
    } else {
      return { x: x1, y: y2 }; // Corner of the L-shape
    }
  }
};

interface NotesWindowProps {
  t: (key: TranslationKey) => string;
}

export const NotesWindow: React.FC<NotesWindowProps> = ({ t }) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  
  const [drawingEdge, setDrawingEdge] = useState<{ sourceId: string; sourcePort: Port; x: number; y: number } | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredPort, setHoveredPort] = useState<{id: string, port: Port} | null>(null);
  const [hoveredDot, setHoveredDot] = useState<{id: string, port: Port} | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());

  // Handle keyboard delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeTag = document.activeElement?.tagName;
        if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;
        
        if (selectedNodes.size > 0) {
          setNodes(prev => prev.filter(n => !selectedNodes.has(n.id)));
          setEdges(prev => prev.filter(edge => !selectedNodes.has(edge.source) && !selectedNodes.has(edge.target)));
          setSelectedNodes(new Set());
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    
    const handleAiRequest = (e: any) => {
      if (e.detail === "notes") {
        let combinedContent = "";
        if (nodes.length === 0) {
          combinedContent = "No notes available in this workspace.";
        } else {
          nodes.forEach(n => {
            combinedContent += `\n\n--- Note: ${n.title || "Untitled"} ---\n${n.content || "(Empty note)"}`;
          });
        }
        
        window.dispatchEvent(new CustomEvent('add_ai_context', {
          detail: {
            id: "notes-workspace",
            title: "Notes Workspace",
            content: "Current Notes Workspace Data:" + combinedContent
          }
        }));
      }
    };
    window.addEventListener("request_ai_context", handleAiRequest);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener("request_ai_context", handleAiRequest);
    };
  }, [selectedNodes, nodes]);
  
  const containerRef = useRef<HTMLDivElement>(null);

  const getWorkspaceCoords = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom
    };
  };
  
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [nodeDragStart, setNodeDragStart] = useState({ x: 0, y: 0 });

  const [resizingNode, setResizingNode] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ w: 0, h: 0, x: 0, y: 0 });

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);

  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [showSidebar, setShowSidebar] = useState(true);

  const isSidebarLoadedRef = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedWidth = localStorage.getItem('notes-sidebar-width');
      if (savedWidth !== null) setSidebarWidth(parseInt(savedWidth, 10));
      
      const savedShow = localStorage.getItem('notes-sidebar-show');
      if (savedShow !== null) setShowSidebar(savedShow === 'true');

      setTimeout(() => { isSidebarLoadedRef.current = true; }, 50);
    }
  }, []);

  useEffect(() => {
    if (isSidebarLoadedRef.current && typeof window !== 'undefined') {
      localStorage.setItem('notes-sidebar-width', sidebarWidth.toString());
      localStorage.setItem('notes-sidebar-show', showSidebar.toString());
    }
  }, [sidebarWidth, showSidebar]);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [sidebarResizeStart, setSidebarResizeStart] = useState({ w: 0, x: 0 });

  const [headerPortalNode, setHeaderPortalNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Attempt to grab the portal immediately so there is no delay
    const checkNode = () => {
      const node = document.getElementById('notes-window-header-portal');
      if (node && !document.contains(headerPortalNode)) {
        setHeaderPortalNode(node);
      }
    };
    
    checkNode(); // Run immediately

    // We use a fast interval to handle Hot Module Replacement (HMR) replacing the DOM node
    const interval = setInterval(checkNode, 100);
    return () => clearInterval(interval);
  }, [headerPortalNode]);

  // Sync current nodes/edges to workspaces
  useEffect(() => {
    if (!isLoaded || !activeWorkspaceId) return;
    setWorkspaces(prev => prev.map(w => w.id === activeWorkspaceId ? { ...w, nodes, edges, updatedAt: Date.now() } : w));
  }, [nodes, edges, activeWorkspaceId, isLoaded]);

  // Load from DB or LocalStorage
  useEffect(() => {
    let initialData = null;
    const local = localStorage.getItem('ck_notes');
    if (local) {
      try { initialData = JSON.parse(local); } catch (e) {}
    } else if (typeof window !== 'undefined' && (window as any).ckNotesCache) {
      initialData = (window as any).ckNotesCache;
    }

    if (initialData && initialData.workspaces) {
      setWorkspaces(initialData.workspaces);
      setActiveWorkspaceId(initialData.activeWorkspaceId || (initialData.workspaces.length > 0 ? initialData.workspaces[0].id : null));
      if (initialData.activeWorkspaceId) {
        const active = initialData.workspaces.find((w: Workspace) => w.id === initialData.activeWorkspaceId);
        if (active) {
          setNodes(active.nodes || []);
          setEdges(active.edges || []);
        }
      } else if (initialData.workspaces.length > 0) {
        setNodes(initialData.workspaces[0].nodes || []);
        setEdges(initialData.workspaces[0].edges || []);
      }
      setIsLoaded(true);
      return;
    }

    fetch('/api/notes?t=' + Date.now())
      .then(res => res.json())
      .then(data => {
        if (data && data.workspaces) {
          setWorkspaces(data.workspaces);
          setActiveWorkspaceId(data.activeWorkspaceId || (data.workspaces.length > 0 ? data.workspaces[0].id : null));
          if (data.activeWorkspaceId) {
            const active = data.workspaces.find((w: Workspace) => w.id === data.activeWorkspaceId);
            if (active) {
              setNodes(active.nodes || []);
              setEdges(active.edges || []);
            }
          } else if (data.workspaces.length > 0) {
            setNodes(data.workspaces[0].nodes || []);
            setEdges(data.workspaces[0].edges || []);
          }
        } else {
          // Migration from old single-workspace structure
          const oldNodes = Array.isArray(data?.nodes) ? data.nodes : [];
          const oldEdges = Array.isArray(data?.edges) ? data.edges : [];
          const defaultWorkspace = {
            id: Date.now().toString(),
            name: t("mainWorkspace"),
            nodes: oldNodes,
            edges: oldEdges,
            updatedAt: Date.now()
          };
          setWorkspaces([defaultWorkspace]);
          setActiveWorkspaceId(defaultWorkspace.id);
          setNodes(oldNodes);
          setEdges(oldEdges);
        }
        setIsLoaded(true);
      })
      .catch(err => {
        console.error("Failed to load notes:", err);
        setIsLoaded(true);
      });
  }, []);

  // Save to DB
  const workspacesRef = useRef(workspaces);
  const activeWorkspaceIdRef = useRef(activeWorkspaceId);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  
  useEffect(() => {
    workspacesRef.current = workspaces;
    activeWorkspaceIdRef.current = activeWorkspaceId;
    nodesRef.current = nodes;
    edgesRef.current = edges;
  }, [workspaces, activeWorkspaceId, nodes, edges]);

  useEffect(() => {
    if (!isLoaded) return;
    
    // 1. Debounced save during active session
    const timeout = setTimeout(() => {
      const payloadObj = { workspaces, activeWorkspaceId };
      if (typeof window !== 'undefined') {
        (window as any).ckNotesCache = payloadObj;
        localStorage.setItem('ck_notes', JSON.stringify(payloadObj));
      }
      fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadObj)
      }).catch(() => {});
    }, 1000);
    
    return () => clearTimeout(timeout);
  }, [workspaces, activeWorkspaceId, isLoaded]);

  // Save on window close or tab refresh
  useEffect(() => {
    if (!isLoaded) return;

    const getLatestPayload = () => {
      const currentWorkspaces = workspacesRef.current.map(w => {
        if (w.id === activeWorkspaceIdRef.current) {
          return { ...w, nodes: nodesRef.current, edges: edgesRef.current, updatedAt: Date.now() };
        }
        return w;
      });
      const payload = { workspaces: currentWorkspaces, activeWorkspaceId: activeWorkspaceIdRef.current };
      const strPayload = JSON.stringify(payload);
      if (typeof window !== 'undefined') {
        (window as any).ckNotesCache = payload;
        localStorage.setItem('ck_notes', strPayload);
      }
      return strPayload;
    };

    const handleBeforeUnload = () => {
      // sendBeacon is perfect for saving data right as the page closes
      const blob = new Blob([getLatestPayload()], { type: 'application/json' });
      navigator.sendBeacon('/api/notes', blob);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Save on component unmount
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: getLatestPayload(),
        keepalive: true
      }).catch(console.error);
    };
  }, [isLoaded]);

  const handleSwitchWorkspace = (id: string) => {
    const target = workspaces.find(w => w.id === id);
    if (!target) return;
    setActiveWorkspaceId(id);
    setNodes(target.nodes || []);
    setEdges(target.edges || []);
    setPan({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleCreateWorkspace = () => {
    const newWs: Workspace = {
      id: Date.now().toString(),
      name: t("newWorkspace"),
      nodes: [],
      edges: [],
      updatedAt: Date.now()
    };
    setWorkspaces([newWs, ...workspaces]);
    setActiveWorkspaceId(newWs.id);
    setNodes([]);
    setEdges([]);
    setPan({ x: 0, y: 0 });
    setZoom(1);
  };
  
  const handleDeleteWorkspace = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const nextWorkspaces = workspaces.filter(w => w.id !== id);
    if (nextWorkspaces.length === 0) {
      const newWs: Workspace = {
        id: Date.now().toString(),
        name: t("mainWorkspace"),
        nodes: [],
        edges: [],
        updatedAt: Date.now()
      };
      setWorkspaces([newWs]);
      setActiveWorkspaceId(newWs.id);
      setNodes([]);
      setEdges([]);
    } else {
      setWorkspaces(nextWorkspaces);
      if (activeWorkspaceId === id) {
        handleSwitchWorkspace(nextWorkspaces[0].id);
      }
    }
  };

  const handleAddNode = () => {
    let cx = window.innerWidth / 4;
    let cy = window.innerHeight / 4;
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      cx = rect.left + rect.width / 2;
      cy = rect.top + rect.height / 2;
    }
    const coords = getWorkspaceCoords(cx, cy);
    
    let x = coords.x - 100;
    let y = coords.y - 75;
    
    // Offset logic to avoid stacking
    let offsetCount = 0;
    while (nodes.some(n => Math.abs(n.x - x) < 10 && Math.abs(n.y - y) < 10) && offsetCount < 10) {
      offsetCount++;
      x += 20;
      y += 20;
    }

    const newNodeId = Date.now().toString();
    const newNode: Node = {
      id: newNodeId,
      x,
      y,
      width: 200,
      height: 150,
      title: "",
      content: ""
    };
    setNodes([...nodes, newNode]);

    setTimeout(() => {
      document.getElementById(`note-title-${newNodeId}`)?.focus();
    }, 50);
  };

  const handleBackgroundMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target === containerRef.current || target.tagName === 'svg' || target.id === 'notes-workspace-inner') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      setSelectedNodes(new Set());
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    } else if (draggingNode) {
      setNodes(nodes.map(n => {
        if (n.id === draggingNode) {
          return {
            ...n,
            x: (e.clientX - pan.x - nodeDragStart.x) / zoom,
            y: (e.clientY - pan.y - nodeDragStart.y) / zoom
          };
        }
        return n;
      }));
    } else if (resizingNode) {
      setNodes(nodes.map(n => {
        if (n.id === resizingNode) {
          return {
            ...n,
            width: Math.max(200, resizeStart.w + (e.clientX - resizeStart.x) / zoom),
            height: Math.max(100, resizeStart.h + (e.clientY - resizeStart.y) / zoom)
          };
        }
        return n;
      }));
    } else if (drawingEdge) {
      const coords = getWorkspaceCoords(e.clientX, e.clientY);
      setDrawingEdge({ ...drawingEdge, x: coords.x, y: coords.y });
    } else if (isResizingSidebar) {
      setSidebarWidth(Math.max(200, Math.min(600, sidebarResizeStart.w + (e.clientX - sidebarResizeStart.x))));
    }
  };

  const handleMouseUp = (e?: React.MouseEvent) => {
    setIsPanning(false);
    setDraggingNode(null);
    setResizingNode(null);
    setIsResizingSidebar(false);

    if (drawingEdge && e) {
      const target = e.target as HTMLElement;
      if (target === containerRef.current || target.id === 'notes-workspace-inner' || target.tagName === 'svg') {
        const coords = getWorkspaceCoords(e.clientX, e.clientY);
        
        let x = coords.x - 100;
        let y = coords.y - 75;
        let offsetCount = 0;
        while (nodes.some(n => Math.abs(n.x - x) < 10 && Math.abs(n.y - y) < 10) && offsetCount < 10) {
          offsetCount++;
          x += 20;
          y += 20;
        }

        const newNodeId = Date.now().toString();
        const newNode: Node = {
          id: newNodeId,
          x,
          y,
          width: 200,
          height: 150,
          title: "",
          content: ""
        };
        setNodes(prev => [...prev, newNode]);

        setTimeout(() => {
          document.getElementById(`note-title-${newNodeId}`)?.focus();
        }, 50);

        let targetPort: Port = 'left';
        if (drawingEdge.sourcePort === 'top') targetPort = 'bottom';
        else if (drawingEdge.sourcePort === 'bottom') targetPort = 'top';
        else if (drawingEdge.sourcePort === 'left') targetPort = 'right';
        else if (drawingEdge.sourcePort === 'right') targetPort = 'left';

        setEdges(prev => [...prev, {
          id: Date.now().toString() + "-edge",
          source: drawingEdge.sourceId,
          target: newNodeId,
          sourcePort: drawingEdge.sourcePort,
          targetPort: targetPort
        }]);
      }
    }

    setDrawingEdge(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomSensitivity = 0.001;
      const newZoom = Math.min(Math.max(0.1, zoom - e.deltaY * zoomSensitivity), 3);
      setZoom(newZoom);
    }
  };

  const bringNodeToFront = (id: string) => {
    setNodes(prev => {
      const idx = prev.findIndex(n => n.id === id);
      if (idx !== -1 && idx !== prev.length - 1) {
        const newNodes = [...prev];
        const [node] = newNodes.splice(idx, 1);
        newNodes.push(node);
        return newNodes;
      }
      return prev;
    });
  };

  const handleNodeMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    
    if (e.shiftKey) {
      setSelectedNodes(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        return newSet;
      });
      return; // Don't drag if shift-clicking
    }

    if (!selectedNodes.has(id)) {
      setSelectedNodes(new Set([id]));
    }

    const node = nodes.find(n => n.id === id);
    if (!node) return;
    setDraggingNode(id);
    setNodeDragStart({
      x: (e.clientX - pan.x) - node.x * zoom,
      y: (e.clientY - pan.y) - node.y * zoom
    });
  };

  const handleResizeMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === id);
    if (!node) return;
    setResizingNode(id);
    setResizeStart({
      w: node.width,
      h: node.height,
      x: e.clientX,
      y: e.clientY
    });
  };

  const handlePortMouseDown = (e: React.MouseEvent, id: string, port: Port) => {
    e.stopPropagation();
    const coords = getWorkspaceCoords(e.clientX, e.clientY);
    setDrawingEdge({ sourceId: id, sourcePort: port, x: coords.x, y: coords.y });
  };

  const handlePortMouseUp = (e: React.MouseEvent, id: string, port: Port) => {
    e.stopPropagation();
    if (drawingEdge && drawingEdge.sourceId !== id) {
      if (!edges.some(edge => edge.source === drawingEdge.sourceId && edge.target === id)) {
        setEdges([...edges, {
          id: Date.now().toString(),
          source: drawingEdge.sourceId,
          target: id,
          sourcePort: drawingEdge.sourcePort,
          targetPort: port
        }]);
      }
    }
    setDrawingEdge(null);
  };

  const handleDeleteNode = (id: string) => {
    setNodes(nodes.filter(n => n.id !== id));
    setEdges(edges.filter(e => e.source !== id && e.target !== id));
  };

  const handleDeleteEdge = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setEdges(edges.filter(edge => edge.id !== id));
  };

  if (!isLoaded) {
    return (
      <div className="window-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', gap: '1rem', color: 'var(--text-muted)' }}>
        <div style={{ width: '30px', height: '30px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <div style={{ fontSize: '0.9rem' }}>{t("loadingWorkspaces")}</div>
        <style>{`
          @keyframes spin { 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <div 
      className="window-content" 
      style={{ 
        padding: 0, 
        overflow: 'hidden', 
        height: '100%', 
        display: 'flex',
        userSelect: (drawingEdge || draggingNode || isPanning || resizingNode || isResizingSidebar) ? 'none' : 'auto'
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {headerPortalNode && createPortal(
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', height: '100%' }}>
          <button 
            onClick={(e) => { e.stopPropagation(); handleCreateWorkspace(); }} 
            title={t("newWorkspace")}
            style={{ background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '0.2rem', padding: '0.1rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}
          >
            <Plus size={10} strokeWidth={3} /> {t("newBtn")} 
          </button>
          <button 
            className="twm-btn"
            onClick={(e) => { e.stopPropagation(); setShowSidebar(!showSidebar); }} 
            title={showSidebar ? t("hideWorkspaces") : t("showWorkspaces")}
            style={{ padding: '0.1rem 0.3rem' }}
          >
            <SidebarIcon size={12} />
          </button>
        </div>,
        headerPortalNode
      )}
      <style>{`
        .port-wrapper .port-dot {
          opacity: 0;
        }
        .port-wrapper:hover .port-dot {
          opacity: 1;
        }
        .port-dot:hover {
          background: var(--accent) !important;
        }
      `}</style>
      {/* Sidebar History */}
      {showSidebar && (
        <div style={{ 
          width: `${sidebarWidth}px`, 
          flexShrink: 0, 
          borderRight: '1px solid var(--line)', 
          background: 'rgba(15,15,20,0.5)', 
          backdropFilter: 'blur(16px)', 
          display: 'flex', 
          flexDirection: 'column', 
          zIndex: 11, 
          position: 'relative' 
        }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {workspaces.map(ws => {
            const isActive = activeWorkspaceId === ws.id;
            return (
              <div 
                key={ws.id}
                onClick={() => handleSwitchWorkspace(ws.id)}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  background: isActive ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                  border: 'none',
                  color: isActive ? '#000' : 'var(--text)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.2)' : 'none'
                }}
                onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; } }}
                onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; } }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, overflow: 'hidden' }}>
                  <LayoutDashboard size={14} color={isActive ? '#000' : 'var(--text-muted)'} style={{ flexShrink: 0, transition: 'color 0.2s' }} />
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.9rem', fontWeight: isActive ? 600 : 500 }}>
                    {ws.name}
                  </div>
                </div>
                {workspaces.length > 1 && (
                  <button 
                    onClick={(e) => handleDeleteWorkspace(e, ws.id)}
                    style={{ 
                      background: 'transparent', border: 'none', 
                      color: isActive ? 'rgba(0,0,0,0.4)' : 'transparent', 
                      padding: '0.2rem', flexShrink: 0, cursor: 'pointer', 
                      transition: 'color 0.2s, background 0.2s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.2rem'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#ff5555'; e.currentTarget.style.background = isActive ? 'rgba(0,0,0,0.1)' : 'rgba(255,85,85,0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = isActive ? 'rgba(0,0,0,0.4)' : 'transparent'; e.currentTarget.style.background = 'transparent'; }}
                    title={t("deleteWorkspace")}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Resize Handle for Sidebar */}
        <div 
          onMouseDown={(e) => {
            setIsResizingSidebar(true);
            setSidebarResizeStart({ w: sidebarWidth, x: e.clientX });
          }}
          style={{
            position: 'absolute',
            right: -3,
            top: 0,
            width: 6,
            height: '100%',
            cursor: 'col-resize',
            zIndex: 20
          }}
        />
      </div>
      )}

      {/* Main Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {/* Floating Bubble Controls */}
        <div style={{ 
          position: 'absolute', 
          top: '1rem', 
          left: '1rem', 
          zIndex: 10, 
          display: 'flex', 
          alignItems: 'center',
          pointerEvents: 'none'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', pointerEvents: 'auto' }}>
            <input 
              value={workspaces.find(w => w.id === activeWorkspaceId)?.name || ""}
              onChange={(e) => setWorkspaces(prev => prev.map(w => w.id === activeWorkspaceId ? { ...w, name: e.target.value } : w))}
              style={{
                background: 'rgba(15,15,20,0.8)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', fontSize: '1.05rem', fontWeight: 600, outline: 'none', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', backdropFilter: 'blur(10px)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', width: '200px'
              }}
            />
          </div>
        </div>

        {/* Floating Action Button - Bottom Right */}
        <div style={{
          position: 'absolute',
          bottom: '1.5rem',
          right: '1.5rem',
          zIndex: 10,
        }}>
          <button 
            onClick={handleAddNode} 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.4rem', 
              background: 'var(--accent)', color: '#000', fontWeight: 700, 
              padding: '0.6rem 1.4rem', borderRadius: '2rem',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              border: 'none', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', fontSize: '0.9rem'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.5)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.4)'; }}
          >
            <Plus size={16} strokeWidth={3} /> {t("newNote")}
          </button>
        </div>

      {/* Workspace */}
      <div 
        ref={containerRef}
        style={{ 
          flex: 1, 
          position: 'relative', 
          cursor: isPanning ? 'grabbing' : 'grab', 
          backgroundColor: 'transparent',
          backgroundImage: 'radial-gradient(var(--line) 1px, transparent 1px)',
          backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
          backdropFilter: 'blur(10px)',
          overflow: 'hidden'
        }}
        onMouseDown={handleBackgroundMouseDown}
        onWheel={handleWheel}
      >
        <div 
          id="notes-workspace-inner"
          style={{ 
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, 
            transformOrigin: '0 0',
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0
          }}
        >
          {/* Edges SVG Layer */}
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
            {edges.map(edge => {
              const sourceNode = nodes.find(n => n.id === edge.source);
              const targetNode = nodes.find(n => n.id === edge.target);
              if (!sourceNode || !targetNode) return null;
              
              const p1 = edge.sourcePort || 'right';
              const p2 = edge.targetPort || 'left';
              const pos1 = getPortPos(sourceNode, p1);
              const pos2 = getPortPos(targetNode, p2);
              const d = getOrthogonalPath(pos1.x, pos1.y, p1, pos2.x, pos2.y, p2);
              const mid = getOrthogonalMidpoint(pos1.x, pos1.y, p1, pos2.x, pos2.y, p2);
              
              return (
                <g 
                  key={edge.id} 
                  style={{ pointerEvents: 'auto' }}
                  onMouseEnter={() => setHoveredEdge(edge.id)}
                  onMouseLeave={() => setHoveredEdge(null)}
                >
                  {/* Invisible Thick Clickable Path */}
                  <path 
                    d={d}
                    fill="none"
                    stroke="transparent" 
                    strokeWidth={15}
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => handleDeleteEdge(e, edge.id)}
                  />
                  <path 
                    d={d}
                    fill="none"
                    stroke="var(--accent)" 
                    strokeWidth={2}
                    opacity={0.6}
                  />
                  {hoveredEdge === edge.id && (
                    <>
                      <circle 
                        cx={mid.x} cy={mid.y} 
                        r={12} 
                        fill="var(--bg)" 
                        stroke="var(--accent)" 
                        strokeWidth={1} 
                        style={{ cursor: 'pointer' }}
                        onClick={(e) => handleDeleteEdge(e, edge.id)}
                      />
                      <text 
                        x={mid.x} y={mid.y + 4} 
                        fontSize="14" 
                        fill="var(--accent)" 
                        textAnchor="middle" 
                        style={{ pointerEvents: 'none', fontWeight: 'bold' }}
                      >
                        ×
                      </text>
                    </>
                  )}
                </g>
              );
            })}
            {drawingEdge && (
              <g style={{ pointerEvents: 'none' }}>
                <path 
                  d={getOrthogonalPath(
                    getPortPos(nodes.find(n => n.id === drawingEdge.sourceId)!, drawingEdge.sourcePort).x, 
                    getPortPos(nodes.find(n => n.id === drawingEdge.sourceId)!, drawingEdge.sourcePort).y, 
                    drawingEdge.sourcePort, 
                    drawingEdge.x, 
                    drawingEdge.y, 
                    'left' // arbitrary target port for the drawing line
                  )}
                  fill="none"
                  stroke="var(--accent)" 
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  opacity={0.8}
                />
              </g>
            )}
          </svg>

          {/* Nodes Layer */}
          {nodes.map(node => (
            <div
              key={node.id}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onMouseDownCapture={() => bringNodeToFront(node.id)}
              style={{
                position: 'absolute',
                left: node.x,
                top: node.y,
                width: node.width,
                height: node.height,
                background: 'var(--bg)',
                border: selectedNodes.has(node.id) ? `1px solid var(--accent)` : `1px solid var(--line)`,
                borderRadius: '0.4rem',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'visible',
                zIndex: draggingNode === node.id ? 100 : 1
              }}
            >
              {/* Node Header */}
              <div 
                style={{ 
                  padding: '0.6rem 0.8rem', 
                  background: 'rgba(0,0,0,0.2)', 
                  borderBottom: '1px solid var(--line)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'move',
                  overflow: 'hidden'
                }}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, height: '100%', minWidth: 0 }}>
                  <Move size={12} color="var(--text-muted)" style={{ pointerEvents: 'none' }} />
                  <input
                    id={`note-title-${node.id}`}
                    type="text"
                    value={node.title || ""}
                    onChange={(e) => setNodes(nodes.map(n => n.id === node.id ? { ...n, title: e.target.value } : n))}
                    onMouseDown={(e) => e.stopPropagation()}
                    placeholder={t("titlePlaceholder")}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--accent)',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      outline: 'none',
                      flex: 1,
                      minWidth: 0
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.3rem', marginLeft: '0.5rem', flexShrink: 0 }}>

                  <button 
                    className="twm-btn" 
                    style={{ 
                      width: '24px', 
                      height: '24px', 
                      padding: 0,
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      color: 'var(--text-muted)', 
                      borderRadius: '4px',
                      background: 'transparent',
                      transition: 'background 0.2s, color 0.2s'
                    }} 
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#ff555520'; e.currentTarget.style.color = '#ff5555'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNode(node.id);
                    }}
                    title={t("deleteNote")}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              
              {/* Node Content */}
              <textarea
                value={node.content}
                onChange={(e) => setNodes(nodes.map(n => n.id === node.id ? { ...n, content: e.target.value } : n))}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  padding: '0.5rem',
                  color: 'var(--text)',
                  fontSize: '0.8rem',
                  resize: 'none',
                  outline: 'none',
                  cursor: 'text'
                }}
                onMouseDown={(e) => e.stopPropagation()} // Allow text selection without dragging
                placeholder={t("takeNotePlaceholder")}
              />
              
              {/* Resize Handle */}
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  bottom: 0,
                  width: '24px',
                  height: '24px',
                  cursor: 'se-resize',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'flex-end',
                  padding: '4px'
                }}
                onMouseDown={(e) => handleResizeMouseDown(e, node.id)}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" style={{ stroke: 'var(--text-muted)', strokeWidth: 1.5, strokeLinecap: 'round', opacity: 0.4, transition: 'opacity 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'} onMouseLeave={(e) => e.currentTarget.style.opacity = '0.4'}>
                  <line x1="11" y1="3" x2="3" y2="11" />
                  <line x1="11" y1="7" x2="7" y2="11" />
                  <line x1="11" y1="11" x2="11" y2="11" strokeWidth="2" />
                </svg>
              </div>

              {/* Edge Handles */}
              {['top', 'right', 'bottom', 'left'].map(port => (
                <div
                  key={port}
                  className="port-wrapper"
                  style={{
                    position: 'absolute',
                    ...(port === 'top' ? { top: -12, left: '50%', transform: 'translateX(-50%)', width: 24, height: 24 } : {}),
                    ...(port === 'bottom' ? { bottom: -12, left: '50%', transform: 'translateX(-50%)', width: 24, height: 24 } : {}),
                    ...(port === 'left' ? { left: -12, top: '50%', transform: 'translateY(-50%)', width: 24, height: 24 } : {}),
                    ...(port === 'right' ? { right: -12, top: '50%', transform: 'translateY(-50%)', width: 24, height: 24 } : {}),
                    zIndex: 20,
                    cursor: 'crosshair',
                  }}
                  onMouseDown={(e) => handlePortMouseDown(e, node.id, port as Port)}
                  onMouseUp={(e) => handlePortMouseUp(e, node.id, port as Port)}
                >
                  <div
                    className="port-dot"
                    style={{
                      position: 'absolute',
                      width: 10, height: 10,
                      background: 'var(--bg)',
                      border: '2px solid var(--accent)',
                      borderRadius: '50%',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      transition: 'opacity 0.2s, background 0.2s',
                      ...(drawingEdge?.sourceId === node.id && drawingEdge?.sourcePort === port ? { opacity: 1, background: 'var(--accent)' } : {})
                    }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
};
