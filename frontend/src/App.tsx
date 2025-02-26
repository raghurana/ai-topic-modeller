import { JSONTree } from 'react-json-tree';
import { useState } from 'react'
import './App.css'

interface FeedbackCluster {
  id: string;
  title: string;
  createDate: string;
  updateDate: string;
  feedbackTexts: string[];
}


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
    
      const data = await response.json() as { clusters: FeedbackCluster[] };
      setServerMessage(JSON.stringify(data.clusters?.map((c) => ({        
        clusterTitle: c.title,        
        updateDateUtc: new Date(c.updateDate).toLocaleString(),
        feedbackTexts: c.feedbackTexts
      }))));
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
