import { JSONTree } from 'react-json-tree';
import { useState } from 'react'
import './App.css'

function App() {
  const [serverMessage, setServerMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const fetchServerMessage = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('http://localhost:3000/', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) 
        throw new Error('Network response was not ok');
    
      const data = await response.json();
      setServerMessage(JSON.stringify(data.clusters));
    } catch (error) {
      console.error('Error fetching server message:', error);
      setServerMessage('Failed to fetch message');
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <h1>Clusters</h1>
      <div>
        Click the button to fetch a message from the server&nbsp;
        <button onClick={fetchServerMessage} disabled={isLoading} value="Refresh">
          {isLoading ? 'Fetching...' : 'Refresh'}
        </button>
        {serverMessage &&  <JSONTree data={JSON.parse(serverMessage)} />}
      </div>
    </>
  )
}

export default App
