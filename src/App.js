import { useEffect, useState } from 'react';
import './App.css';

const getFDC3NoteError = (message) => ({
  type: "fdc3.note",
  name: "ERROR",
  id: {
    error: message
  }
});

function App() {
  const [notes, setNotes] = useState([]);
  const [fdc3Ready, setFdc3Ready] = useState(false);

  useEffect(() => {
    const initializeFDC3 = async () => {
      try {
        // Check if FDC3 is available
        if (window.fdc3) {
          setFdc3Ready(true);
          console.log('FDC3 is ready');

          // Add intent listeners
          setupIntentListeners();
        } else {
          console.warn('FDC3 not available - running in standalone mode');
          // For development/testing without FDC3
          setFdc3Ready(false);
        }
      } catch (error) {
        console.error('Error initializing FDC3:', error);
        setFdc3Ready(false);
      }
    };

    const setupIntentListeners = async () => {
      try {
        // Listen for AddNote intent
        await window.fdc3.addIntentListener('AddNote', (context) => {
          console.log('Received AddNote intent:', context);
          return handleAddNote(context);
        });

        // Listen for RemoveNote intent
        await window.fdc3.addIntentListener('RemoveNote', (context) => {
          console.log('Received RemoveNote intent:', context);
          return handleRemoveNote(context);
        });

        console.log('Intent listeners registered successfully');
      } catch (error) {
        console.error('Error setting up intent listeners:', error);
      }
    };

    initializeFDC3();
  }, []);
  const handleAddNote = (context) => {
    try {
      console.log('Processing AddNote intent with context:', context);

      if (context.type !== 'fdc3.note') {
        console.error(`Invalid context type received: ${context.type}`);
        return getFDC3NoteError(`Invalid context type. Expected 'fdc3.note', received '${context.type}'`);
      }

      const { noteId, content, from } = context.id;

      if (!noteId || !content) {
        console.error('Missing required fields in AddNote intent');
        return getFDC3NoteError('Missing required fields: id.noteId and id.content must be provided');
      }

      const noteData = {
        id: noteId,
        content,
        from,
        timestamp: new Date().toISOString()
      };
      console.log('Prepared note data:', noteData);

      setNotes(prevNotes => {
        const existingNoteIndex = prevNotes.findIndex(note => note.id === noteId);
        if (existingNoteIndex !== -1) {
          console.log(`Updating existing note at index ${existingNoteIndex}`);
          const updatedNotes = [...prevNotes];
          updatedNotes[existingNoteIndex] = { ...updatedNotes[existingNoteIndex], ...noteData };
          return updatedNotes;
        } else {
          console.log('Adding new note');
          return [...prevNotes, noteData];
        }
      });

      console.log('Successfully processed AddNote intent');
      return { type: "fdc3.note", name: "SUCCESS", id: { noteId: noteData.id } };
    } catch (error) {
      console.error('Error in handleAddNote:', error);
      return getFDC3NoteError(`Failed to process AddNote intent: ${error.message}`);
    }
  };

  const handleRemoveNote = (context) => {
    try {
      console.log('Processing RemoveNote intent with context:', context);

      if (context.type !== 'fdc3.note') {
        console.error(`Invalid context type received: ${context.type}`);
        return getFDC3NoteError(`Invalid context type. Expected 'fdc3.note', received '${context.type}'`);
      }

      const { noteId } = context.id;
      console.log('Attempting to remove note with ID:', noteId);

      if (!noteId) {
        console.error('Missing noteId in RemoveNote intent');
        return getFDC3NoteError('Missing required field: id.noteId must be provided');
      }

      setNotes(prevNotes => {
        const filteredNotes = prevNotes.filter(note => note.id !== noteId);
        if (filteredNotes.length < prevNotes.length) {
          console.log(`Successfully removed note with ID: ${noteId}`);
          return filteredNotes;
        } else {
          console.log(`Note with ID ${noteId} not found`);
          return prevNotes;
        }
      });
      console.log('Successfully processed RemoveNote intent');
      return { type: "fdc3.note", name: "SUCCESS", id: { noteId } };
    } catch (error) {
      console.error('Error in handleRemoveNote:', error);
      return getFDC3NoteError(`Failed to process RemoveNote intent: ${error.message}`);
    }
  };

  const addTestNote = () => {
    const testNote = {
      id: `test-${Date.now()}`,
      content: 'This is a test note added manually',
      from: 'Deal Room with a lot of people',
      timestamp: new Date().toISOString()
    };
    setNotes(prevNotes => [...prevNotes, testNote]);
  };

  const removeNote = (noteId) => {
    setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>📝 Hackathon Note App</h1>
        <div className="status-indicator">
          <span className={`status ${fdc3Ready ? 'connected' : 'disconnected'}`}>
            FDC3: {fdc3Ready ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </header>

      <main className="App-main">
        <div className="notes-container">
          <div className="notes-header">
            <h2>Notes ({notes.length})</h2>
            <button onClick={addTestNote} className="add-test-btn">
              Add Test Note
            </button>
          </div>

          {notes.length === 0 ? (
            <div className="empty-state">
              <p>No notes yet. Send an FDC3 intent to add notes!</p>
              <div className="intent-info">
                <h3>Supported Intents:</h3>
                <ul>
                  <li>
                    <strong>AddNote</strong> - Add or update a note
                    <br />
                    <small>Context: type: "fdc3.note", id: {`{ noteId: "string", content: "string" }`}</small>
                  </li>
                  <li>
                    <strong>RemoveNote</strong> - Remove a note by ID
                    <br />
                    <small>Context: type: "fdc3.note", id: {`{ noteId: "string" }`}</small>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="notes-list">
              {notes.map(note => (
                <div key={note.id} className="note-card">
                  <div className="note-header">
                    <h5>{new Date(note.timestamp).toLocaleString()}</h5>
                    <button
                      onClick={() => removeNote(note.id)}
                      className="remove-btn"
                      title="Remove note"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="note-content">{note.content}</p>
                  <div className="note-meta">
                    <div><small>ID: {note.id}</small></div>
                    {note.from && (
                      <div><small>FROM: {note.from}</small></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


export default App;
