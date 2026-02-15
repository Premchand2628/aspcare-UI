import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import '../styles/Chatbot.css';

const Chatbot = () => {
  const navigate = useNavigate();
  const [selectedBot, setSelectedBot] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [selectedWaterOption, setSelectedWaterOption] = useState(null);
  const [selectedCarType, setSelectedCarType] = useState('');
  const [selectedWashType, setSelectedWashType] = useState('');
  const [selectedRate, setSelectedRate] = useState(null);
  const [ratesInfo, setRatesInfo] = useState(null);
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!selectedBot) {
      setMessages([
        {
          type: 'bot',
          text: 'Hello! How can I help you today? Choose an option below.',
        },
      ]);
    }
  }, [selectedBot]);

  const handleBotSelect = (bot) => {
    setSelectedBot(bot);
    setMessages([]);
    
    if (bot === 'faq') {
      setMessages([
        {
          type: 'bot',
          text: 'Welcome to FAQ! 📚 I can answer common questions about our car wash services, pricing, memberships, and more. What would you like to know?',
        },
      ]);
    } else if (bot === 'booking') {
      setMessages([
        {
          type: 'bot',
          text: 'Welcome to Booking Assistant! 📅 I can help you book a car wash service. What service would you like to book?',
        },
        {
          type: 'options',
          options: ['Self Drive', 'Home Service', 'ASP Care', 'Teflon Coating'],
        },
      ]);
    } else if (bot === 'support') {
      setMessages([
        {
          type: 'bot',
          text: 'Welcome to Customer Support! 💬 How can I assist you today? Please describe your issue or question.',
        },
      ]);
    }
  };

  const handleSendMessage = (text = null) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    setMessages([...messages, { type: 'user', text: messageText }]);
    setInput('');

    setTimeout(() => {
      let botResponse = '';

      if (selectedBot === 'faq') {
        const faqResponses = {
          price: 'Our car wash services range from ₹300 to ₹1500 depending on the package.',
          membership: 'We offer monthly and yearly membership plans with great discounts.',
          center: 'We have multiple car wash centers across the city.',
          services: 'We provide Self Drive, Home Service, ASP Care, and Teflon Coating.',
          appointment: 'You can book appointments through the app anytime!',
        };

        const lowerCaseInput = messageText.toLowerCase();
        botResponse = Object.entries(faqResponses).find(([key]) =>
          lowerCaseInput.includes(key)
        )?.[1] || 'I can help with questions about pricing, memberships, centers, services, and appointments. Try asking about any of these!';

        setMessages((prevMessages) => [
          ...prevMessages,
          { type: 'bot', text: botResponse },
        ]);
      } else if (selectedBot === 'booking') {
        // Check if it's a service booking
        const serviceTypes = ['Home Service', 'Self Drive', 'ASP Care', 'Teflon Coating'];
        if (serviceTypes.includes(messageText)) {
          setSelectedService(messageText);
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              type: 'bot',
              text: `Great! Let me show you available dates. Please select your preferred date for ${messageText}:`,
            },
            {
              type: 'calendar',
              dates: getNextSevenDays(),
            },
          ]);
        } else {
          botResponse = `Great! You selected "${messageText}". Please provide your preferred date and time for the booking.`;
          setMessages((prevMessages) => [
            ...prevMessages,
            { type: 'bot', text: botResponse },
          ]);
        }
      } else if (selectedBot === 'support') {
        botResponse =
          'Thank you for reaching out! Our support team will get back to you shortly. Is there anything else I can help with?';
        setMessages((prevMessages) => [
          ...prevMessages,
          { type: 'bot', text: botResponse },
        ]);
      }
    }, 500);
  };

  const handleOptionClick = (option) => {
    // Check if this is a time slot selection (selectedDate is set but selectedTimeSlot is not)
    if (selectedDate && !selectedTimeSlot && availabilitySlots.includes(option)) {
      setSelectedTimeSlot(option);
      
      // Add user message
      setMessages((prevMessages) => [
        ...prevMessages,
        { type: 'user', text: `Selected time: ${option}` },
      ]);

      // Show checkbox options for water bottle
      setTimeout(() => {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            type: 'bot',
            text: 'Great! Now, would you like to add a water bottle to your booking?',
          },
          {
            type: 'checkboxes',
            options: [
              { label: 'Get additional ₹100 off by providing water & power', value: 'with-water' },
              { label: 'No, Thanks', value: 'no-water' }
            ],
          },
        ]);
      }, 500);
    } else {
      handleSendMessage(option);
    }
  };

  const getNextSevenDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const getServiceTypeForApi = (serviceName) => {
    const serviceMap = {
      'Home Service': 'HOME',
      'Self Drive': 'SELFDRIVE',
      'ASP Care': 'ASP_CARE',
      'Teflon Coating': 'TEFLON'
    };
    return serviceMap[serviceName] || serviceName;
  };

  const getVehicleTypeForApi = (vehicleType) => {
    const vehicleMap = {
      Hatchback: 'HATCHBACK',
      Sedan: 'SEDAN',
      SUV: 'SUV',
      MPV: 'MPV',
      Pickup: 'PICKUP',
      Bike: 'BIKE'
    };
    return vehicleMap[vehicleType] || vehicleType;
  };

  const getWashTypeForApi = (washType) => {
    const washMap = {
      Foam: 'FOAM',
      Basic: 'BASIC',
      Premium: 'PREMIUM'
    };
    return washMap[washType] || washType;
  };

  const getWaterOptionLabel = (value) => {
    return value === 'with-water'
      ? 'Get additional ₹100 off by providing water & power'
      : 'No, Thanks';
  };

  const fetchAvailability = async (date, serviceName) => {
    setLoading(true);
    try {
      const serviceType = getServiceTypeForApi(serviceName);
      const url = `/bookings/availability?date=${date}&serviceType=${serviceType}`;
      
      const authToken = localStorage.getItem('authToken');
      const headers = {
        'Accept': 'application/json'
      };
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error('Failed to fetch availability');
      }

      const data = await response.json();
      
      // Extract available slots from response
      // Assuming response is an object with time slots as keys
      const slots = Object.entries(data)
        .filter(([time, available]) => available)
        .map(([time]) => time);
      
      setAvailabilitySlots(slots.length > 0 ? slots : ['No slots available']);
      return slots;
    } catch (error) {
      console.error('Error fetching availability:', error);
      setAvailabilitySlots(['Unable to fetch slots']);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchRates = async (vehicleType, washType) => {
    setLoading(true);
    try {
      const vehicleTypeApi = getVehicleTypeForApi(vehicleType);
      const washTypeApi = getWashTypeForApi(washType);
      const url = `/rates?vehicleType=${vehicleTypeApi}&washLevel=${washTypeApi}`;

      const authToken = localStorage.getItem('authToken');
      const headers = {
        'Accept': 'application/json'
      };
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error('Failed to fetch rates');
      }

      const data = await response.json();
      setRatesInfo(data);
      return data;
    } catch (error) {
      console.error('Error fetching rates:', error);
      setRatesInfo(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const buildRateOptions = (data, carType, washType) => {
    if (Array.isArray(data)) {
      return data.map((item, index) => {
        const amount = item?.amount ?? item?.price ?? item?.rate ?? item?.total;
        const vehicle = item?.vehicleType || carType;
        const wash = item?.washLevel || washType;
        return {
          id: `${vehicle}-${wash}-${index}`,
          carType: vehicle,
          washType: wash,
          amount
        };
      });
    }

    const amount = data?.amount ?? data?.price ?? data?.rate ?? data?.total;
    return [{
      id: `${carType}-${washType}-0`,
      carType,
      washType,
      amount
    }];
  };

  const handleDateSelect = (date) => {
    const formattedDate = formatDate(date);
    setSelectedDate(formattedDate);
    
    // Add user message
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const dateDisplay = `${dayName}, ${dateStr}`;
    
    setMessages((prevMessages) => [
      ...prevMessages,
      { type: 'user', text: `Selected date: ${dateDisplay}` },
    ]);

    // Fetch availability slots
    (async () => {
      const slots = await fetchAvailability(formattedDate, selectedService);
      
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          type: 'bot',
          text: `Perfect! I've selected ${dateDisplay} for your ${selectedService}. Please select your preferred time slot.`,
        },
        {
          type: 'options',
          options: slots.length > 0 ? slots : ['No slots available for this date'],
          isTimeslots: true,
        },
      ]);
    })();
  };

  const handleBackToMenu = () => {
    setSelectedBot(null);
    setSelectedService(null);
    setSelectedDate(null);
    setSelectedTimeSlot(null);
    setSelectedWaterOption(null);
    setSelectedCarType('');
    setSelectedWashType('');
    setSelectedRate(null);
    setRatesInfo(null);
  };

  const handleWaterOptionSelect = (value) => {
    setSelectedWaterOption(value);

    const waterOptionText = getWaterOptionLabel(value);

    setMessages((prevMessages) => [
      ...prevMessages,
      { type: 'user', text: waterOptionText },
    ]);

    setTimeout(() => {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          type: 'bot',
          text: 'Please select your car type and wash type to get the rate.',
        },
        {
          type: 'rollers',
          carTypes: ['Hatchback', 'Sedan', 'SUV', 'MPV', 'Pickup', 'Bike'],
          washTypes: ['Foam', 'Basic', 'Premium']
        },
      ]);
    }, 400);
  };

  const handleCarTypeSelect = async (value) => {
    setSelectedCarType(value);
    if (value && selectedWashType) {
      const data = await fetchRates(value, selectedWashType);
      showRatesMessage(data, value, selectedWashType);
    }
  };

  const handleWashTypeSelect = async (value) => {
    setSelectedWashType(value);
    if (value && selectedCarType) {
      const data = await fetchRates(selectedCarType, value);
      showRatesMessage(data, selectedCarType, value);
    }
  };

  const showRatesMessage = (data, carType, washType) => {
    const rateOptions = buildRateOptions(data, carType, washType);

    setMessages((prevMessages) => [
      ...prevMessages,
      { type: 'bot', text: 'Select a rate to continue.' },
      {
        type: 'rate-options',
        options: rateOptions
      },
    ]);
  };

  const handleRateSelect = (option) => {
    setSelectedRate(option);

    const baseRate = option?.amount ?? 0;
    const hasWaterDiscount = selectedWaterOption === 'with-water';
    const waterDiscount = hasWaterDiscount ? 100 : 0;
    const finalAmount = baseRate - waterDiscount;

    const amountText = `₹${baseRate}`;

    setMessages((prevMessages) => [
      ...prevMessages,
      { type: 'user', text: `Selected rate: ${amountText}` },
      {
        type: 'review',
        details: {
          service: selectedService,
          date: selectedDate,
          time: selectedTimeSlot,
          waterOption: getWaterOptionLabel(selectedWaterOption),
          carType: option?.carType || selectedCarType,
          washType: option?.washType || selectedWashType,
          baseRate: baseRate,
          waterDiscount: waterDiscount,
          hasWaterDiscount: hasWaterDiscount,
          finalAmount: finalAmount
        }
      },
      {
        type: 'options',
        options: ['Proceed to Payment', 'Change Selection']
      }
    ]);
  };

  return (
    <div className="chatbot-page">
      {/* Header */}
      <header className="chatbot-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ←
        </button>
        <div className="header-content">
          <div className="header-icon">🚗</div>
          <h1>ASP Care Assistant</h1>
        </div>
        <div style={{ width: '60px' }}></div>
      </header>

      {/* Main Content */}
      <div className="chatbot-container">
        {!selectedBot ? (
          /* Bot Selection Menu */
          <div className="bot-menu">
            <div className="menu-greeting">
              <h2>How can we help?</h2>
              <p>Choose a chat option below</p>
            </div>
            <div className="bot-options">
              <button
                className="bot-option faq"
                onClick={() => handleBotSelect('faq')}
              >
                <span className="bot-icon">❓</span>
                <span className="bot-name">FAQ</span>
                <span className="bot-desc">Common questions</span>
              </button>
              <button
                className="bot-option booking"
                onClick={() => handleBotSelect('booking')}
              >
                <span className="bot-icon">📅</span>
                <span className="bot-name">Book Assistant</span>
                <span className="bot-desc">Book a service</span>
              </button>
              <button
                className="bot-option support"
                onClick={() => handleBotSelect('support')}
              >
                <span className="bot-icon">💬</span>
                <span className="bot-name">Customer Support</span>
                <span className="bot-desc">Get help now</span>
              </button>
            </div>
          </div>
        ) : (
          /* Chat Interface */
          <div className="chat-interface">
            <div className="chat-header">
              <button className="back-btn-chat" onClick={handleBackToMenu}>
                ←
              </button>
              <div className="header-content">
                <div className="header-icon">
                  {selectedBot === 'faq' ? '❓' : selectedBot === 'booking' ? '📅' : '💬'}
                </div>
                <h2>
                  {selectedBot === 'faq'
                    ? 'FAQ'
                    : selectedBot === 'booking'
                    ? 'Book Assistant'
                    : 'Customer Support'}
                </h2>
              </div>
              <div style={{ width: '60px' }}></div>
            </div>

            {/* Messages */}
            <div className="messages-container">
              {messages.map((msg, idx) =>
                msg.type === 'user' ? (
                  <div key={idx} className="message user-message">
                    <p>{msg.text}</p>
                  </div>
                ) : msg.type === 'bot' ? (
                  <div key={idx} className="message bot-message">
                    <p>{msg.text}</p>
                  </div>
                ) : msg.type === 'options' ? (
                  <div key={idx} className="message bot-message options-message">
                    <div className={`options-group ${msg.isTimeslots ? 'timeslots-grid' : ''}`}>
                      {msg.options.map((option, optIdx) => (
                        <button
                          key={optIdx}
                          className="option-btn"
                          onClick={() => handleOptionClick(option)}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : msg.type === 'calendar' ? (
                  <div key={idx} className="message bot-message calendar-message">
                    <div className="calendar-grid">
                      {msg.dates.map((date, dateIdx) => {
                        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                        const dateNum = date.getDate();
                        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
                        const isToday = new Date().toDateString() === date.toDateString();
                        
                        return (
                          <button
                            key={dateIdx}
                            className={`calendar-btn ${isToday ? 'today' : ''}`}
                            onClick={() => handleDateSelect(date)}
                          >
                            <div className="day-name">{dayName}</div>
                            <div className="date-num">{dateNum}</div>
                            <div className="month-name">{monthName}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : msg.type === 'checkboxes' ? (
                  <div key={idx} className="message bot-message checkboxes-message">
                    <div className="checkboxes-group">
                      {msg.options.map((option, optIdx) => (
                        <label key={optIdx} className="checkbox-item">
                          <input
                            type="radio"
                            name="water-option"
                            value={option.value}
                            checked={selectedWaterOption === option.value}
                            onChange={() => handleWaterOptionSelect(option.value)}
                          />
                          <span className="checkbox-label">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : msg.type === 'rollers' ? (
                  <div key={idx} className="message bot-message rollers-message">
                    <div className="rollers-group">
                      <div className="roller">
                        <label className="roller-label">Car Type</label>
                        <select
                          value={selectedCarType}
                          onChange={(e) => handleCarTypeSelect(e.target.value)}
                          className="roller-select"
                        >
                          <option value="">Select</option>
                          {msg.carTypes.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      <div className="roller">
                        <label className="roller-label">Wash Type</label>
                        <select
                          value={selectedWashType}
                          onChange={(e) => handleWashTypeSelect(e.target.value)}
                          className="roller-select"
                        >
                          <option value="">Select</option>
                          {msg.washTypes.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {loading && <div className="roller-status">Loading rates...</div>}
                  </div>
                ) : msg.type === 'rate-options' ? (
                  <div key={idx} className="message bot-message rate-options-message">
                    <div className="rate-options-group">
                      {msg.options.map((option) => {
                        const amountText = option?.amount !== undefined && option?.amount !== null
                          ? `₹${option.amount}`
                          : 'View rate';
                        const label = `${option.carType} (${option.washType})`;

                        return (
                          <button
                            key={option.id}
                            className="rate-option-btn"
                            onClick={() => handleRateSelect(option)}
                          >
                            <span className="rate-option-title">{label}</span>
                            <span className="rate-option-amount">{amountText}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : msg.type === 'review' ? (
                  <div key={idx} className="message bot-message review-message">
                    <div className="review-card">
                      <div className="review-title">Booking Review</div>
                      <div className="review-row"><span>Service</span><span>{msg.details.service}</span></div>
                      <div className="review-row"><span>Date</span><span>{msg.details.date}</span></div>
                      <div className="review-row"><span>Time</span><span>{msg.details.time}</span></div>
                      <div className="review-row"><span>Water Option</span><span>{msg.details.waterOption}</span></div>
                      <div className="review-row"><span>Car Type</span><span>{msg.details.carType}</span></div>
                      <div className="review-row"><span>Wash Type</span><span>{msg.details.washType}</span></div>
                      <div className="review-row"><span>Rate</span><span>₹{msg.details.baseRate}</span></div>
                      {msg.details.hasWaterDiscount && (
                        <div className="review-row discount"><span>Water Discount</span><span>-₹{msg.details.waterDiscount}</span></div>
                      )}
                      <div className="review-row total"><span>Final</span><span>₹{msg.details.finalAmount}</span></div>
                    </div>
                  </div>
                ) : null
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="input-container">
              <input
                type="text"
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button onClick={() => handleSendMessage()} className="send-btn">
                Send
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav active="none" />
    </div>
  );
};

export default Chatbot;
