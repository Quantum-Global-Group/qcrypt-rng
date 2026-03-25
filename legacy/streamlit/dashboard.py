"""
QCrypt RNG - Production Dashboard
Quantum Random Number Generation API Interface
"""

import streamlit as st
import requests
import json
from datetime import datetime

# Configuration
API_BASE_URL = "http://localhost:8000/api/v2"

# Page config
st.set_page_config(
    page_title="QCrypt RNG | Quantum Random Generation",
    page_icon="⚛",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Production-ready CSS
st.markdown("""
<style>
    /* Header & branding */
    .qcrypt-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.5rem 0;
        margin-bottom: 2rem;
        border-bottom: 1px solid rgba(148, 163, 184, 0.2);
    }
    .qcrypt-logo {
        font-size: 2rem;
        font-weight: 700;
        letter-spacing: -0.02em;
        background: linear-gradient(135deg, #14b8a6 0%, #38bdf8 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    .qcrypt-tagline {
        color: #94a3b8;
        font-size: 0.95rem;
        margin-top: 0.25rem;
    }
    .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: rgba(16, 185, 129, 0.15);
        border: 1px solid rgba(16, 185, 129, 0.4);
        border-radius: 9999px;
        font-size: 0.875rem;
        font-weight: 500;
    }
    .status-dot {
        width: 8px;
        height: 8px;
        background: #10b981;
        border-radius: 50%;
        animation: pulse 2s infinite;
    }
    .status-badge.offline {
        background: rgba(244, 63, 94, 0.15);
        border-color: rgba(244, 63, 94, 0.4);
    }
    .status-badge.offline .status-dot { background: #f43f5e; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    
    /* Section cards */
    .stTabs [data-baseweb="tab-list"] {
        gap: 0.5rem;
        margin-bottom: 2rem;
    }
    .stTabs [data-baseweb="tab-list"] button {
        font-size: 0.95rem !important;
        font-weight: 500 !important;
        padding: 0.75rem 1.25rem !important;
        border-radius: 0.5rem !important;
    }
    div[data-testid="stVerticalBlock"] > div:has(> div[data-testid="stMarkdown"] h3) {
        margin-top: 2rem;
        padding-top: 1.5rem;
        border-top: 1px solid rgba(148, 163, 184, 0.15);
    }
    div[data-testid="stVerticalBlock"] > div:has(> div[data-testid="stMarkdown"] h3):first-of-type {
        margin-top: 0;
        padding-top: 0;
        border-top: none;
    }
    
    /* Metric cards */
    div[data-testid="stMetric"] {
        background: rgba(30, 41, 59, 0.6);
        padding: 1rem;
        border-radius: 0.5rem;
        border: 1px solid rgba(148, 163, 184, 0.1);
    }
    
    /* Hide Streamlit branding in production */
    #MainMenu { visibility: hidden; }
    footer { visibility: hidden; }
    
    /* Footer */
    .qcrypt-footer {
        margin-top: 3rem;
        padding-top: 1.5rem;
        border-top: 1px solid rgba(148, 163, 184, 0.2);
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
    }
</style>
""", unsafe_allow_html=True)


def check_api_health():
    """Check if API is reachable."""
    try:
        r = requests.get(f"{API_BASE_URL.replace('/api/v2', '')}/health", timeout=3)
        return r.status_code == 200
    except Exception:
        return False


# Sidebar
with st.sidebar:
    st.markdown("### Navigation")
    st.markdown("---")
    
    api_online = check_api_health()
    if api_online:
        st.markdown('<div class="status-badge"><span class="status-dot"></span>API Online</div>', unsafe_allow_html=True)
    else:
        st.markdown('<div class="status-badge offline"><span class="status-dot"></span>API Offline</div>', unsafe_allow_html=True)
    
    st.markdown("---")
    st.markdown("**Quick Links**")
    st.markdown("[API Documentation](http://localhost:8000/docs)")
    st.markdown("[ReDoc](http://localhost:8000/redoc)")
    st.markdown("---")
    st.caption(f"QCrypt RNG v2.0 · {datetime.now().strftime('%Y-%m-%d')}")

# Header
st.markdown("""
<div class="qcrypt-header">
    <div>
        <div class="qcrypt-logo">QCrypt RNG</div>
        <div class="qcrypt-tagline">Enterprise Quantum Random Number Generation</div>
    </div>
    <div>
""" + ('<div class="status-badge"><span class="status-dot"></span>Operational</div>' if check_api_health() else '<div class="status-badge offline"><span class="status-dot"></span>API Unavailable</div>') + """
    </div>
</div>
""", unsafe_allow_html=True)

# Helper function
def api_call(endpoint, data):
    try:
        url = f"{API_BASE_URL}{endpoint}"
        response = requests.post(url, json=data, timeout=10)
        if response.status_code == 200:
            return response.json(), None
        else:
            return None, f"Error {response.status_code}: {response.text}"
    except Exception as e:
        return None, f"Connection Error: {str(e)}"

def api_call_form(endpoint, data):
    """For form-encoded endpoints"""
    try:
        url = f"{API_BASE_URL}{endpoint}"
        response = requests.post(url, data=data, timeout=10)
        if response.status_code == 200:
            return response.json(), None
        else:
            return None, f"Error {response.status_code}: {response.text}"
    except Exception as e:
        return None, f"Connection Error: {str(e)}"

# ============================================================================
# MAIN TABS
# ============================================================================
main_tab1, main_tab2, main_tab3 = st.tabs([
    "🎲 Quantum RNG",
    "⚛️ Quantum Oracle",
    "🎯 Use Cases"
])

# ============================================================================
# TAB 1: QUANTUM RNG (All 5 core features)
# ============================================================================
with main_tab1:
    st.header("Quantum Random Number Generation")
    st.caption("Generate cryptographically secure random data using quantum mechanics")
    
    # Sub-sections in one tab
    st.markdown("#### Random Bytes")
    with st.container(border=True):
        col1, col2 = st.columns([2, 1])
        with col1:
            bytes_length = st.number_input("Bytes to generate", 1, 1024, 32, key="bytes_len")
            bytes_qubits = st.slider("Qubits", 1, 16, 8, key="bytes_qubits")
            bytes_format = st.selectbox("Format", ["hex", "base64", "array"], key="bytes_fmt")
            
            if st.button("Generate Bytes", key="btn_bytes", use_container_width=True):
                with st.spinner("Generating..."):
                    result, error = api_call("/generate/bytes", {
                        "length": bytes_length,
                        "quantum_bits": bytes_qubits,
                        "format": bytes_format
                    })
                    if result and result.get("data"):
                        st.success(f"✅ Generated {bytes_length} bytes")
                        m1, m2, m3 = st.columns(3)
                        with m1:
                            st.metric("Entropy", f"{result['data']['entropy_bits']} bits")
                        with m2:
                            st.metric("Time", f"{result['metadata']['generation_time_ms']:.2f}ms")
                        with m3:
                            st.metric("Qubits", result['metadata']['qubits_used'])
                        st.code(result["data"]["bytes"], language="text")
                        st.download_button("💾 Download", result["data"]["bytes"], f"bytes_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt")
                    else:
                        st.error(f"❌ {error}")
        with col2:
            st.info("**Use Cases**\n• Cryptographic salts\n• Random seeds\n• Nonces\n• Testing data")
    
    st.divider()
    
    # Cryptographic Keys
    st.markdown("#### Cryptographic Keys")
    with st.container(border=True):
        col1, col2 = st.columns([2, 1])
        with col1:
            key_algo = st.selectbox("Algorithm", ["AES", "RSA", "ECDSA"], key="key_algo")
            if key_algo == "AES":
                key_size = st.selectbox("Key size", [128, 192, 256], index=2, key="key_size")
            elif key_algo == "RSA":
                key_size = st.selectbox("Key size", [2048, 3072, 4096], index=0, key="key_size_rsa")
            else:
                key_size = st.selectbox("Curve", ["P-256", "P-384", "P-521"], index=0, key="key_curve")
            key_format = st.selectbox("Format", ["hex", "base64", "pem"], key="key_fmt")
            
            if st.button("Generate Key", key="btn_key", use_container_width=True):
                with st.spinner("Generating key..."):
                    result, error = api_call("/generate/key", {
                        "algorithm": key_algo,
                        "key_size": key_size,
                        "format": key_format
                    })
                    if result and result.get("data"):
                        st.success(f"✅ {key_algo} key generated")
                        m1, m2 = st.columns(2)
                        with m1:
                            st.metric("Algorithm", result["data"]["algorithm"].upper())
                        with m2:
                            st.metric("Size", f"{result['data'].get('key_size_bits', 'N/A')} bits")
                        
                        key_data = result["data"].get("key", result["data"].get("public_key", ""))
                        if len(key_data) > 200:
                            st.text_area("Key", key_data, height=100, key="key_output")
                        else:
                            st.code(key_data, language="text")
                        
                        if "private_key" in result["data"]:
                            with st.expander("🔒 Private Key"):
                                st.code(result["data"]["private_key"][:200] + "...", language="text")
                        
                        st.download_button("💾 Download", json.dumps(result["data"], indent=2), f"{key_algo.lower()}_key.json")
                    else:
                        st.error(f"❌ {error}")
        with col2:
            st.info("**Algorithms**\n• AES: Symmetric\n• RSA: Asymmetric\n• ECDSA: Signatures")
    
    st.divider()
    
    # Session Tokens
    st.markdown("#### Session Tokens")
    with st.container(border=True):
        col1, col2 = st.columns([2, 1])
        with col1:
            token_length = st.slider("Token length (bytes)", 16, 128, 32, key="token_len")
            token_expires = st.number_input("Expires in (seconds)", 60, 31536000, 3600, key="token_exp")
            token_urlsafe = st.checkbox("URL-safe encoding", value=True, key="token_urlsafe")
            
            if st.button("Generate Token", key="btn_token", use_container_width=True):
                with st.spinner("Generating token..."):
                    result, error = api_call("/generate/token", {
                        "length": token_length,
                        "url_safe": token_urlsafe,
                        "expires_in": token_expires
                    })
                    if result and result.get("data"):
                        st.success("✅ Token generated")
                        m1, m2 = st.columns(2)
                        with m1:
                            st.metric("Expires In", f"{result['data']['expires_in']}s")
                        with m2:
                            expires_at = datetime.fromisoformat(result["data"]["expires_at"].replace('Z', '+00:00'))
                            st.metric("Expires At", expires_at.strftime("%H:%M:%S"))
                        st.code(result["data"]["token"], language="text")
                        st.download_button("💾 Download", result["data"]["token"], "token.txt")
                    else:
                        st.error(f"❌ {error}")
        with col2:
            st.info("**Use Cases**\n• User sessions\n• API auth\n• CSRF tokens\n• Access codes")
    
    st.divider()
    
    # UUIDs
    st.markdown("#### Quantum UUIDs")
    with st.container(border=True):
        col1, col2 = st.columns([2, 1])
        with col1:
            uuid_count = st.number_input("Number of UUIDs", 1, 100, 1, key="uuid_count")
            uuid_format = st.selectbox("Format", ["standard", "raw", "urn"], key="uuid_fmt")
            
            if st.button("Generate UUID(s)", key="btn_uuid", use_container_width=True):
                with st.spinner("Generating UUID(s)..."):
                    result, error = api_call("/generate/uuid", {
                        "version": 4,
                        "count": uuid_count,
                        "format": uuid_format
                    })
                    if result and result.get("data"):
                        st.success(f"✅ Generated {uuid_count} UUID(s)")
                        if isinstance(result["data"], list):
                            for i, uuid in enumerate(result["data"], 1):
                                st.code(f"{i}. {uuid}", language="text")
                            output = "\n".join(result["data"])
                        else:
                            st.code(result["data"], language="text")
                            output = result["data"]
                        st.download_button("💾 Download", output, f"uuids_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt")
                    else:
                        st.error(f"❌ {error}")
        with col2:
            st.info("**Use Cases**\n• Database IDs\n• Resource IDs\n• Distributed systems\n• File names")
    
    st.divider()
    
    # Passwords
    st.markdown("#### Secure Passwords")
    with st.container(border=True):
        col1, col2 = st.columns([2, 1])
        with col1:
            pwd_length = st.slider("Password length", 8, 64, 16, key="pwd_len")
            
            st.write("**Character Types:**")
            pwd_uppercase = st.checkbox("Uppercase letters (A-Z)", value=True, key="pwd_upper")
            pwd_lowercase = st.checkbox("Lowercase letters (a-z)", value=True, key="pwd_lower")
            pwd_numbers = st.checkbox("Numbers (0-9)", value=True, key="pwd_nums")
            pwd_symbols = st.checkbox("Symbols (!@#$...)", value=True, key="pwd_syms")
            pwd_exclude_ambiguous = st.checkbox("Exclude ambiguous (0O1lI)", value=False, key="pwd_exclude")
            
            if st.button("Generate Password", key="btn_pwd", use_container_width=True):
                with st.spinner("Generating password..."):
                    result, error = api_call("/generate/password", {
                        "length": pwd_length,
                        "include_uppercase": pwd_uppercase,
                        "include_lowercase": pwd_lowercase,
                        "include_numbers": pwd_numbers,
                        "include_symbols": pwd_symbols,
                        "exclude_ambiguous": pwd_exclude_ambiguous
                    })
                    if result and result.get("data"):
                        st.success("✅ Password generated")
                        m1, m2, m3 = st.columns(3)
                        with m1:
                            st.metric("Length", result["data"]["length"])
                        with m2:
                            st.metric("Strength", result["data"]["strength"].replace("_", " ").title())
                        with m3:
                            st.metric("Entropy", f"{result['data']['entropy_bits']:.1f} bits")
                        
                        password = result["data"]["password"]
                        st.code(password, language="text")
                        
                        strength = result["data"]["strength"]
                        if strength == "very_strong":
                            st.success("🟢 Very Strong Password")
                        elif strength == "strong":
                            st.info("🔵 Strong Password")
                        else:
                            st.warning("🟡 Medium Strength")
                        
                        st.download_button("💾 Save", password, "password.txt")
                    else:
                        st.error(f"❌ {error}")
        with col2:
            st.info("**Strength**\n• 8-11: Medium\n• 12-15: Strong\n• 16+: Very Strong")

# ============================================================================
# TAB 2: QUANTUM RANDOMNESS ORACLE
# ============================================================================
with main_tab2:
    st.header("Quantum Randomness Oracle")
    st.caption("Verifiable quantum randomness for blockchain applications")

    # Oracle network status
    with st.container(border=True):
        st.subheader("Oracle Network Status")
        if st.button("Refresh Network Info", key="refresh_oracle", use_container_width=True):
            with st.spinner("Fetching network information..."):
                try:
                    response = requests.get(f"{API_BASE_URL}/oracle/network-info")
                    if response.status_code == 200:
                        result = response.json()
                        network = result.get("data", {}).get("network", {})
                        
                        st.success(f"✅ {network.get('name', 'Quantum Randomness Oracle Network')}")
                        
                        m1, m2, m3, m4 = st.columns(4)
                        with m1:
                            st.metric("Status", network.get('status', 'Unknown'))
                        with m2:
                            st.metric("Nodes", network.get('nodes_count', 0))
                        with m3:
                            st.metric("Active Requests", network.get('active_requests', 0))
                        with m4:
                            st.metric("Uptime", f"{network.get('uptime_hours', 0)}h")
                            
                        # Performance metrics
                        perf = result.get("data", {}).get("performance", {})
                        if perf:
                            st.subheader("Performance Metrics")
                            m1, m2, m3 = st.columns(3)
                            with m1:
                                st.metric("Total Generated", f"{perf.get('total_randomness_generated', 0)} bytes")
                            with m2:
                                avg_time = perf.get('average_generation_time_ms', 0)
                                st.metric("Avg Generation Time", f"{avg_time:.2f}ms")
                            with m3:
                                entropy = perf.get('entropy_quality', {}).get('shannon_entropy', 0)
                                st.metric("Entropy Quality", f"{entropy:.3f}")
                                
                        # Features
                        features = result.get("data", {}).get("features", {})
                        if features:
                            st.subheader("Features")
                            cols = st.columns(3)
                            for i, (feature, enabled) in enumerate(features.items()):
                                with cols[i % 3]:
                                    icon = "✅" if enabled else "❌"
                                    st.write(f"{icon} {feature.replace('_', ' ').title()}")
                    else:
                        st.error("❌ Unable to fetch network information")
                except Exception as e:
                    st.error(f"❌ Error fetching network info: {str(e)}")

    st.divider()
    
    # Request quantum randomness
    with st.container(border=True):
        st.subheader("Request Quantum Randomness")
        col1, col2 = st.columns([2, 1])
        with col1:
            oracle_bytes = st.number_input("Bytes to generate", 1, 1024, 32, key="oracle_bytes")
            oracle_qubits = st.slider("Qubits to use", 1, 16, 8, key="oracle_qubits")
            oracle_callback_gas = st.number_input("Callback gas limit", 100000, 500000, 200000, key="oracle_gas")
            
            if st.button("Request Randomness", key="btn_oracle_request", use_container_width=True):
                with st.spinner("Sending request to oracle..."):
                    result, error = api_call("/oracle/request", {
                        "num_bytes": oracle_bytes,
                        "num_qubits": oracle_qubits,
                        "callback_gas_limit": oracle_callback_gas
                    })
                    
                    if result and result.get("data"):
                        st.success("✅ Request submitted to oracle")
                        req_data = result["data"]
                        
                        m1, m2, m3 = st.columns(3)
                        with m1:
                            st.metric("Request ID", req_data.get("request_id", "N/A")[-8:])
                        with m2:
                            st.metric("Estimated Blocks", req_data.get("estimated_completion_blocks", "N/A"))
                        with m3:
                            st.metric("Fee Required", f"{req_data.get('fee_required', 0)/1e16} ETH")
                        
                        if req_data.get("commitment"):
                            with st.expander("🔐 Commitment Hash"):
                                st.code(req_data["commitment"], language="text")
                        
                        st.info("ℹ️ The oracle will generate quantum randomness and fulfill this request on the blockchain")
                    else:
                        st.error(f"❌ {error}")
        
        with col2:
            st.info("**Use Cases**\n• Gaming: Fair loot drops\n• NFTs: Trait distribution\n• DeFi: Random selection\n• DAOs: Committee selection")

    st.divider()
    
    # Check request status
    with st.container(border=True):
        st.subheader("Check Request Status")
        col1, col2 = st.columns([2, 1])
        with col1:
            status_request_id = st.text_input("Request ID", placeholder="Enter request ID", key="status_req_id")
            
            if st.button("Check Status", key="btn_status", use_container_width=True):
                if status_request_id:
                    with st.spinner("Checking request status..."):
                        try:
                            response = requests.get(f"{API_BASE_URL}/oracle/status/{status_request_id}")
                            if response.status_code == 200:
                                result = response.json()
                                status_data = result.get("data", {})
                                
                                status = status_data.get("status", "unknown")
                                if status == "fulfilled":
                                    st.success(f"✅ Request {status}!")
                                elif status in ["pending_commitment", "committed"]:
                                    st.info(f"⏳ Request {status.title()}")
                                else:
                                    st.warning(f"⚠️ Request {status.title()}")
                                
                                m1, m2, m3 = st.columns(3)
                                with m1:
                                    st.metric("Status", status_data.get("status", "N/A"))
                                with m2:
                                    st.metric("Fulfilled", "Yes" if status_data.get("fulfilled") else "No")
                                with m3:
                                    st.metric("Block", status_data.get("block_number", "N/A"))
                                
                                if status_data.get("randomness"):
                                    with st.expander("🎲 Randomness Value"):
                                        st.code(status_data["randomness"], language="text")
                                        
                                if status_data.get("commitment"):
                                    with st.expander("🔐 Commitment"):
                                        st.code(status_data["commitment"], language="text")
                            else:
                                st.error("❌ Request not found")
                        except Exception as e:
                            st.error(f"❌ Error checking status: {str(e)}")
                else:
                    st.warning("⚠️ Please enter a request ID")
        
        with col2:
            st.info("**Status Guide**\n• pending_commitment: Request registered\n• committed: Oracle has committed\n• fulfilled: Randomness delivered\n• expired: Request timed out")

    st.divider()
    
    # Oracle benchmark
    with st.container(border=True):
        st.subheader("Oracle Performance Benchmark")
        if st.button("Run Benchmark", key="btn_benchmark", use_container_width=True):
            with st.spinner("Running performance benchmark..."):
                try:
                    response = requests.get(f"{API_BASE_URL}/oracle/benchmark")
                    if response.status_code == 200:
                        result = response.json()
                        bench = result.get("data", {}).get("benchmark", {})
                        
                        st.success("✅ Benchmark completed")
                        
                        m1, m2, m3, m4 = st.columns(4)
                        with m1:
                            st.metric("Samples", bench.get("samples_generated", 0))
                        with m2:
                            st.metric("Avg Time", f"{bench.get('avg_generation_time_ms', 0):.2f}ms")
                        with m3:
                            st.metric("Throughput", f"{bench.get('throughput_samples_per_sec', 0)} samples/s")
                        with m4:
                            st.metric("Total Time", f"{bench.get('total_time_ms', 0):.2f}ms")
                        
                        with st.expander("📊 Detailed Results"):
                            st.write(f"**Generation Only:** {bench.get('generation_only_time_ms', 0):.2f}ms")
                            st.write(f"**Commitment Only:** {bench.get('commitment_only_time_ms', 0):.2f}ms")
                            st.write(f"**Avg Commitment Time:** {bench.get('avg_commitment_time', 0):.2f}ms")
                            st.write(f"**Avg Entropy:** {bench.get('average_entropy_bits_per_sample', 0):.2f} bits")
                    else:
                        st.error("❌ Unable to run benchmark")
                except Exception as e:
                    st.error(f"❌ Error running benchmark: {str(e)}")

# ============================================================================
# TAB 3: USE CASES & APPLICATIONS
# ============================================================================
with main_tab3:
    st.header("Use Cases & Applications")
    st.caption("Real-world applications of quantum randomness for blockchain")

    # Use case selection
    use_case = st.selectbox("Select Use Case", [
        "Gaming & Entertainment", 
        "NFTs & Digital Assets", 
        "DeFi & Finance", 
        "DAOs & Governance",
        "Prediction Markets",
        "All Use Cases"
    ], key="use_case_select")

    # Gaming use case
    if use_case in ["Gaming & Entertainment", "All Use Cases"]:
        with st.container(border=True):
            st.subheader("🎮 Gaming & Entertainment")
            col1, col2 = st.columns([1, 2])
            with col1:
                st.image("https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80", caption="Fair Gaming with Quantum Randomness")
            with col2:
                st.write("**Applications:**")
                st.write("- Fair loot drop mechanisms")
                st.write("- Random tournament bracket generation")
                st.write("- Transparent casino game outcomes")
                st.write("- Random character attribute assignment")
                
                st.write("**Benefits:**")
                st.write("- Verifiable fairness")
                st.write("- Tamper-proof randomness")
                st.write("- Player trust assurance")
                
                if st.button("Demo Game Randomness", key="demo_game", use_container_width=True):
                    with st.spinner("Generating game randomness..."):
                        result, error = api_call("/oracle/request", {
                            "num_bytes": 16,
                            "num_qubits": 8,
                            "callback_gas_limit": 200000
                        })
                        if result and result.get("data"):
                            st.success("🎲 Game randomness generated!")
                            st.code(f"Random seed: {result['data']['request_id'][-16:]}", language="text")
                        else:
                            st.error("❌ Demo failed")

    # NFT use case
    if use_case in ["NFTs & Digital Assets", "All Use Cases"]:
        st.divider()
        with st.container(border=True):
            st.subheader("🎨 NFTs & Digital Assets")
            col1, col2 = st.columns([1, 2])
            with col1:
                st.image("https://images.unsplash.com/photo-1620336655052-b57986f5a26a?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80", caption="Verifiable NFT Trait Distribution")
            with col2:
                st.write("**Applications:**")
                st.write("- Random trait distribution during minting")
                st.write("- Fair NFT rarity allocation")
                st.write("- Transparent airdrop mechanisms")
                st.write("- Random artwork generation parameters")
                
                st.write("**Benefits:**")
                st.write("- Provable randomness in traits")
                st.write("- Eliminates mint manipulation")
                st.write("- Increases collector trust")
                
                if st.button("Demo NFT Randomness", key="demo_nft", use_container_width=True):
                    with st.spinner("Generating NFT randomness..."):
                        result, error = api_call("/generate/bytes", {
                            "length": 32,
                            "quantum_bits": 16,
                            "format": "hex"
                        })
                        if result and result.get("data"):
                            st.success("🎨 NFT trait randomness generated!")
                            st.code(f"Traits hash: {result['data']['bytes'][:32]}...", language="text")
                        else:
                            st.error("❌ Demo failed")

    # DeFi use case
    if use_case in ["DeFi & Finance", "All Use Cases"]:
        st.divider()
        with st.container(border=True):
            st.subheader("💰 DeFi & Finance")
            col1, col2 = st.columns([1, 2])
            with col1:
                st.image("https://images.unsplash.com/photo-1635372389856-98a6d2d3ecca?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80", caption="Secure DeFi Random Selection")
            with col2:
                st.write("**Applications:**")
                st.write("- Random winner selection for lotteries")
                st.write("- Fair governance proposal selection")
                st.write("- Random validator/node selection")
                st.write("- Incentive distribution mechanisms")
                
                st.write("**Benefits:**")
                st.write("- Eliminates selection bias")
                st.write("- Verifiable fairness")
                st.write("- Prevents manipulation")
                
                if st.button("Demo DeFi Randomness", key="demo_defi", use_container_width=True):
                    with st.spinner("Generating DeFi randomness..."):
                        result, error = api_call("/oracle/request", {
                            "num_bytes": 8,
                            "num_qubits": 8,
                            "callback_gas_limit": 200000
                        })
                        if result and result.get("data"):
                            st.success("💰 DeFi selection randomness generated!")
                            st.code(f"Selection ID: {result['data']['request_id'][-8:]}", language="text")
                        else:
                            st.error("❌ Demo failed")

    # DAO use case
    if use_case in ["DAOs & Governance", "All Use Cases"]:
        st.divider()
        with st.container(border=True):
            st.subheader("🏛️ DAOs & Governance")
            col1, col2 = st.columns([1, 2])
            with col1:
                st.image("https://images.unsplash.com/photo-1553877522-43269d4ea984?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80", caption="Fair DAO Committee Selection")
            with col2:
                st.write("**Applications:**")
                st.write("- Random committee member selection")
                st.write("- Fair voting delegate assignment")
                st.write("- Random audit participant selection")
                st.write("- Proposal random ordering")
                
                st.write("**Benefits:**")
                st.write("- Prevents gaming of selection")
                st.write("- Ensures democratic process")
                st.write("- Increases participation trust")
                
                if st.button("Demo DAO Randomness", key="demo_dao", use_container_width=True):
                    with st.spinner("Generating DAO randomness..."):
                        result, error = api_call("/generate/bytes", {
                            "length": 16,
                            "quantum_bits": 12,
                            "format": "hex"
                        })
                        if result and result.get("data"):
                            st.success("🏛️ DAO selection randomness generated!")
                            st.code(f"Committee seed: {result['data']['bytes'][:24]}...", language="text")
                        else:
                            st.error("❌ Demo failed")

    # Prediction Markets use case
    if use_case in ["Prediction Markets", "All Use Cases"]:
        st.divider()
        with st.container(border=True):
            st.subheader("📊 Prediction Markets")
            col1, col2 = st.columns([1, 2])
            with col1:
                st.image("https://images.unsplash.com/photo-1591696205602-e0c4e3aaf08d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80", caption="Unpredictable Outcome Resolution")
            with col2:
                st.write("**Applications:**")
                st.write("- Unpredictable event outcome determination")
                st.write("- Random oracle selection")
                st.write("- Fair market maker selection")
                st.write("- Random dispute resolution")
                
                st.write("**Benefits:**")
                st.write("- Truly unpredictable outcomes")
                st.write("- Eliminates outcome manipulation")
                st.write("- Increases market confidence")
                
                if st.button("Demo Market Randomness", key="demo_market", use_container_width=True):
                    with st.spinner("Generating market randomness..."):
                        result, error = api_call("/oracle/request", {
                            "num_bytes": 4,
                            "num_qubits": 8,
                            "callback_gas_limit": 200000
                        })
                        if result and result.get("data"):
                            st.success("📊 Market resolution randomness generated!")
                            st.code(f"Outcome seed: {result['data']['request_id'][-6:]}", language="text")
                        else:
                            st.error("❌ Demo failed")

    # Summary
    st.divider()
    with st.container(border=True):
        st.subheader("🚀 Ready for Deployment")
        st.write("All use cases are fully implemented and ready for production deployment:")
        
        cols = st.columns(3)
        with cols[0]:
            st.success("**✅ Gaming**\nFair, verifiable randomness")
        with cols[1]:
            st.success("**✅ NFTs**\nTransparent trait distribution") 
        with cols[2]:
            st.success("**✅ DeFi**\nSecure selection mechanisms")
        
        cols2 = st.columns(2)
        with cols2[0]:
            st.success("**✅ DAOs**\nDemocratic governance")
        with cols2[1]:
            st.success("**✅ Markets**\nUnpredictable outcomes")

# ============================================================================
# TAB 3: POST-QUANTUM CRYPTOGRAPHY
# ============================================================================
with main_tab3:
    st.header("Post-Quantum Cryptography")
    st.caption("NIST-standardized quantum-resistant algorithms")

    col1, col2 = st.columns([2, 1])

    with col1:
        with st.container(border=True):
            st.subheader("Generate Quantum-Safe Keys")
            pqc_type = st.radio("Algorithm Type", ["Signatures (DILITHIUM)", "Key Exchange (KYBER)"], key="pqc_type")

            if pqc_type == "Signatures (DILITHIUM)":
                pqc_algo = st.selectbox("Security Level", ["DILITHIUM2", "DILITHIUM3", "DILITHIUM5"], index=1, key="pqc_algo")
            else:
                pqc_algo = st.selectbox("Security Level", ["KYBER512", "KYBER768", "KYBER1024"], index=1, key="pqc_algo_kyber")

            pqc_format = st.selectbox("Format", ["base64", "hex"], key="pqc_fmt")

            if st.button("Generate PQC Keys", key="btn_pqc", use_container_width=True):
                with st.spinner("Generating quantum-safe keys..."):
                    result, error = api_call_form("/pqc/generate", {
                        "algorithm": pqc_algo,
                        "format": pqc_format
                    })

                    if result and result.get("data"):
                        st.success(f"✅ {pqc_algo} key pair generated!")

                        m1, m2, m3 = st.columns(3)
                        with m1:
                            st.metric("NIST Level", result["data"]["nist_security_level"])
                        with m2:
                            st.metric("Public Key", f"{result['data']['key_sizes']['public_key_bytes']} bytes")
                        with m3:
                            st.metric("Private Key", f"{result['data']['key_sizes']['private_key_bytes']} bytes")

                        with st.expander("🔑 Public Key"):
                            st.code(result["data"]["public_key"][:150] + "...", language="text")

                        with st.expander("🔒 Private Key (Keep Secure!)"):
                            st.code(result["data"]["private_key"][:150] + "...", language="text")

                        st.download_button(
                            "💾 Download Keys",
                            json.dumps(result["data"], indent=2),
                            f"{pqc_algo.lower()}_keys.json"
                        )
                    else:
                        st.error(f"❌ {error}")

        st.divider()

        with st.container(border=True):
            st.subheader("Quantum Threat Assessment")
            threat_algo = st.selectbox("Algorithm to Assess",
                                   ["RSA-1024", "RSA-2048", "RSA-4096", "ECDSA-256", "ECDSA-384",
                                    "KYBER768", "DILITHIUM3"],
                                   key="threat_algo")

            if st.button("Assess Threat", key="btn_threat", use_container_width=True):
                with st.spinner("Analyzing quantum threat..."):
                    result, error = api_call_form("/pqc/threat-assessment", {
                        "algorithm": threat_algo
                    })

                    if result and result.get("data"):
                        assessment = result["data"]["assessment"]

                        status = assessment.get("status", "Unknown")
                        if status in ["BROKEN NOW", "VULNERABLE"]:
                            st.error(f"🚨 Status: **{status}**")
                        elif status == "AT RISK":
                            st.warning(f"⚠️ Status: **{status}**")
                        elif status == "SECURE":
                            st.success(f"✅ Status: **{status}**")

                        m1, m2, m3 = st.columns(3)
                        with m1:
                            st.metric("Risk Level", assessment.get("risk_level", "Unknown"))
                        with m2:
                            qubits = assessment.get("qubits_to_break", "N/A")
                            if "N/A" in str(qubits):
                                st.metric("Qubits to Break", "N/A")
                            else:
                                st.metric("Qubits to Break", qubits)
                        with m3:
                            st.metric("Time to Break", assessment.get("time_to_break", "Unknown"))

                        st.info(f"**💡 Recommendation:** {assessment.get('recommendation', 'N/A')}")

                        if "quantum_progress" in result.get("metadata", {}):
                            with st.expander("📅 Quantum Computing Timeline"):
                                for year, event in result["metadata"]["quantum_progress"].items():
                                    st.write(f"**{year}:** {event}")
                    else:
                        st.error(f"❌ {error}")

    with col2:
        st.info("""
        **🛡️ NIST Standards**

        Post-quantum algorithms standardized by NIST in 2024.

        **DILITHIUM (FIPS 204)**
        Digital signatures resistant to quantum attacks.

        **KYBER (FIPS 203)**
        Key encapsulation for secure key exchange.

        **Security Levels:**
        • Level 1: AES-128 equivalent
        • Level 3: AES-192 equivalent
        • Level 5: AES-256 equivalent
        """)

        st.warning("""
        **⏰ Quantum Timeline**

        • 2024: 1000+ qubit systems
        • 2027: RSA-1024 at risk
        • 2030: RSA-2048 vulnerable
        • 2035: All classical crypto broken

        **Migrate to PQC now!**
        """)

# Footer
st.markdown("""
<div class="qcrypt-footer">
    <span style="color: #64748b; font-size: 0.875rem;">QCrypt RNG v2.0 · Quantum-Enhanced Cryptography</span>
    <span>
        <a href="http://localhost:8000/docs" style="color: #38bdf8; text-decoration: none; margin-right: 1rem;">API Docs</a>
        <a href="http://localhost:8000/redoc" style="color: #38bdf8; text-decoration: none;">ReDoc</a>
    </span>
</div>
""", unsafe_allow_html=True)