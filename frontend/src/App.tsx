import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.textContent = 'Welcome, Jenni.ai team! Highlight this text to experience the "Paraphrasing" feature! (If this feature errors, it is probably because my Render.com account is free and the backend spun out.)';
    }
  }, []);
  const [selectedText, setSelectedText] = useState('');
  const [isParaphrasing, setIsParaphrasing] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0, show: false });


  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const selected = selection.toString();
      setSelectedText(selected);

      if (selected.trim()) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setButtonPosition({
          x: rect.left + (rect.width / 2),
          y: rect.top - 40,
          show: true
        });
      } else {
        setButtonPosition({ x: 0, y: 0, show: false });
      }
    } else {
      setButtonPosition({ x: 0, y: 0, show: false });
      setSelectedText('');
    }
  };

  const handleParaphrase = async () => {
    if (!selectedText.trim()) {
      alert('Please select some text to paraphrase.');
      return;
    }

    setIsParaphrasing(true);
    setButtonPosition({ x: 0, y: 0, show: false });

    try {
      // Use the deployed Render.com backend URL instead of localhost
      const response = await fetch('https://texteditortest.onrender.com/paraphrase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: selectedText }),
      });

      if (!response.ok) {
        throw new Error('Failed to paraphrase');
      }

      const data = await response.json();
      const paraphrased = data.paraphrased;

      // Replace the selected text using DOM manipulation to preserve cursor position
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(paraphrased));
        selection.removeAllRanges();
        
        // Place cursor at the end of the inserted text
        range.collapse(false);
        selection.addRange(range);
      }
      setSelectedText('');
    } catch (error) {
      console.error('Error paraphrasing text:', error);
      alert('Failed to paraphrase text. Please try again.');
    } finally {
      setIsParaphrasing(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>AI Text Editor</h1>
      </header>
      
      <main className="editor-container">
        <div
          ref={editorRef}
          contentEditable
          onSelect={handleTextSelection}
          onMouseUp={handleTextSelection}
          onKeyUp={handleTextSelection}
          className="text-editor"
          style={{
            whiteSpace: 'pre-wrap',
            minHeight: '200px',
            border: '1px solid #ccc',
            padding: '10px',
            outline: 'none',
            direction: 'ltr',
            unicodeBidi: 'normal',
            textAlign: 'left'
          }}
          suppressContentEditableWarning={true}
          dir="ltr"
        >
        </div>
        
        {buttonPosition.show && (
          <button 
            onClick={handleParaphrase}
            disabled={isParaphrasing}
            className="floating-paraphrase-btn"
            style={{
              position: 'fixed',
              left: `${buttonPosition.x - 75}px`,
              top: `${buttonPosition.y}px`,
              zIndex: 1000
            }}
          >
            {isParaphrasing ? 'Paraphrasing...' : 'Paraphrase'}
          </button>
        )}
      </main>
    </div>
  );
}

export default App;
