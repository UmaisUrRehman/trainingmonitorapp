document.addEventListener("DOMContentLoaded", function() {
    // Get session ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session');
    
    if (!sessionId) {
        alert('No session ID found in URL');
        window.location.href = "{{ url_for('index') }}";
        return;
    }

    // Fetch session data from server
    fetch(`https://trainingmonitorapp.com/get_session_data?sessionId=${sessionId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Store session data in localStorage
                localStorage.setItem("session_id", data.session_id);
                localStorage.setItem("hrSlider", data.hr || 0);
                localStorage.setItem("rrSlider", data.rr || 0);
                localStorage.setItem("sbpSlider", data.sbp || 0);
                localStorage.setItem("dbpSlider", data.dbp || 0);
                localStorage.setItem("spo2Slider", data.spo2 || 0);
                localStorage.setItem("etco2Slider", data.etco2 || 0);
                
                // Redirect to main page
                window.location.href = "{{ url_for('index') }}";
            } else {
                alert('Session not found: ' + (data.message || 'Unknown error'));
                window.location.href = "{{ url_for('index') }}";
            }
        })
        .catch(error => {
            console.error('Error joining session:', error);
            alert('Error joining session. Please try again.');
            window.location.href = "{{ url_for('index') }}";
        });
});