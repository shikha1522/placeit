// Import required hooks
import { useState } from 'react';
import '../styles/BulkUpload.css';


// Admin bulk upload page component
const BulkUpload = () => {
  // State for selected file
  const [file, setFile] = useState(null);

  // State for upload result
  const [result, setResult] = useState(null);

  // State for loading
  const [loading, setLoading] = useState(false);

  // State for error message
  const [error, setError] = useState('');

  // Get token from localStorage
  const token = localStorage.getItem('token');

  // Handle file selection
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
    setError('');
  };

  // Handle upload submit
  const handleUpload = async () => {
    // Check file selected
    if (!file) {
      setError('Please select a CSV file first');
      return;
    }

    // Check file is CSV
    if (!file.name.endsWith('.csv')) {
      setError('Only CSV files are allowed');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Create form data with file
      const formData = new FormData();
      formData.append('file', file);

      // Send to backend
      const res = await fetch('/api/questions/bulk-upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.message || 'Upload failed');
      }
    } catch (err) {
      setError('Upload failed, try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bulk-container">

      {/* Page header */}
      <div className="bulk-header">
        <h1>Bulk Upload Questions</h1>
        <p>Upload a CSV file to add multiple questions at once</p>
      </div>

      {/* CSV format guide */}
      <div className="bulk-guide">
        <h3>CSV Format</h3>
        <p>Your CSV file must have these columns in this order:</p>
        <code>title, description, difficulty, topic, leetcode_url</code>
        <p className="guide-note">difficulty must be: easy / medium / hard</p>
      </div>

      {/* Upload area */}
      <div className="bulk-upload-area">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="bulk-file-input"
          id="csvFile"
        />
        <label htmlFor="csvFile" className="bulk-file-label">
          {file ? file.name : 'Choose CSV file'}
        </label>

        <button
          onClick={handleUpload}
          disabled={loading || !file}
          className="bulk-upload-btn"
        >
          {loading ? 'Uploading...' : 'Upload'}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bulk-error">{error}</div>
      )}

      {/* Upload result */}
      {result && (
        <div className="bulk-result">
          <h3>Upload Complete</h3>
          <div className="result-stats">
            <span className="result-inserted">✓ {result.inserted} inserted</span>
            <span className="result-skipped">↷ {result.skipped} skipped (duplicates)</span>
          </div>
          {result.errors?.length > 0 && (
            <div className="result-errors">
              <h4>Errors ({result.errors.length})</h4>
              {result.errors.map((e, i) => (
                <p key={i} className="result-error-item">{e}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BulkUpload;