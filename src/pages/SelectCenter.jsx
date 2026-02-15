import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/SelectCenter.css';

const SelectCenter = () => {
  const navigate = useNavigate();
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState('');
  const [centres, setCentres] = useState([]);
  const [loadingAreas, setLoadingAreas] = useState(true);
  const [loadingCentres, setLoadingCentres] = useState(false);
  const [selectedCentre, setSelectedCentre] = useState(null);

  // Fetch areas on component mount
  useEffect(() => {
    fetchAreas();
  }, []);

  // Fetch centres when area is selected
  useEffect(() => {
    if (selectedArea) {
      fetchCentres(selectedArea);
    }
  }, [selectedArea]);

  const fetchAreas = async () => {
    try {
      setLoadingAreas(true);
      const authToken = localStorage.getItem('authToken');
      const headers = {
        'Accept': 'application/json'
      };
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }
      
      const response = await fetch('/centres/areas', {
        method: 'GET',
        headers
      });
      if (response.ok) {
        const data = await response.json();
        setAreas(data);
      } else {
        console.error('Failed to fetch areas');
      }
    } catch (error) {
      console.error('Error fetching areas:', error);
    } finally {
      setLoadingAreas(false);
    }
  };

  const fetchCentres = async (area) => {
    try {
      setLoadingCentres(true);
      const authToken = localStorage.getItem('authToken');
      const headers = {
        'Accept': 'application/json'
      };
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }
      
      const response = await fetch(`/centres/search?area=${encodeURIComponent(area)}`, {
        method: 'GET',
        headers
      });
      if (response.ok) {
        const data = await response.json();
        setCentres(data);
      } else {
        setCentres([]);
        console.error('Failed to fetch centres');
      }
    } catch (error) {
      console.error('Error fetching centres:', error);
      setCentres([]);
    } finally {
      setLoadingCentres(false);
    }
  };

  const handleSelectCentre = (centre) => {
    setSelectedCentre(centre);
    // You can navigate with centre data if needed
    navigate('/booking', { state: { selectedCentre: centre } });
  };

  return (
    <div className="page-container">
      {/* Header */}
      <header className="select-center-header">
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <h2 className="header-title">Select Service Centre</h2>
      </header>

      {/* Area Dropdown */}
      <div className="area-selection">
        <label className="area-label">Select Area</label>
        <select 
          value={selectedArea} 
          onChange={(e) => setSelectedArea(e.target.value)}
          className="area-dropdown"
          disabled={loadingAreas}
        >
          <option value="">Choose an area...</option>
          {areas.map((area, index) => (
            <option key={index} value={area}>
              {area}
            </option>
          ))}
        </select>
      </div>

      {/* Loading State */}
      {loadingCentres && (
        <div className="loading-message">
          Loading service centres...
        </div>
      )}

      {/* Centres List */}
      {selectedArea && !loadingCentres && (
        <div className="centers-list">
          {centres.length > 0 ? (
            centres.map(centre => (
              <div 
                key={centre.id} 
                className="center-item"
                onClick={() => handleSelectCentre(centre)}
              >
                <div className="center-icon">🏢</div>
                <div className="center-info">
                  <h3>{centre.name}</h3>
                  <p className="center-location">📍 {centre.area}</p>
                  <p className="center-address">{centre.address}</p>
                  {centre.rating && (
                    <p className="center-rating">⭐ {centre.rating}</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="no-centres-message">
              No service centres found in {selectedArea}
            </div>
          )}
        </div>
      )}

      {/* Select Button */}
      {selectedCentre && (
        <button className="select-center-btn" onClick={() => navigate('/booking', { state: { selectedCentre } })}>
          Continue with {selectedCentre.name}
        </button>
      )}
    </div>
  );
};

export default SelectCenter;
