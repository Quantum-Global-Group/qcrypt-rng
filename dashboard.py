"""
QCrypt RNG - Production Dashboard
Quantum Random Number Generation API Interface
"""

import streamlit as st
import requests
import json
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
from datetime import datetime
import time

# Configuration
API_BASE_URL = "http://localhost:8000/api/v2"

# Page config
st.set_page_config(
    page_title="QCrypt RNG - Quantum Random Generation",
    page_icon="🎲",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        font-weight: bold;
        color: #1f77b4;
        margin-bottom: 0;
    }
    .sub-header {
        font-size: 1.2rem;
        color: #666;
        margin-top: 0;
    }
    .section-divider {
        border-top: 2px solid #e0e0e0;
        margin: 2rem 0;
    }
    stTabs [data-baseweb="tab-list"] button {
        font-size: 1.1rem;
        font-weight: 600;
    }
</style>
""", unsafe_allow_html=True)

# Header
col1, col2 = st.columns([3, 1])
with col1:
    st.markdown('<h1 class="main-header">🎲 QCrypt RNG</h1>', unsafe_allow_html=True)
    st.markdown('<p class="sub-header">Enterprise Quantum Random Number Generation</p>', unsafe_allow_html=True)
with col2:
    st.metric("API Status", "🟢 Online")

st.markdown("---")

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
    "⛓️ Blockchain Security",
    "🔮 Post-Quantum Crypto"
])

# ============================================================================
# TAB 1: QUANTUM RNG (All 5 core features)
# ============================================================================
with main_tab1:
    st.header("Quantum Random Number Generation")
    st.write("Generate cryptographically secure random data using quantum mechanics")
    
    # Sub-sections in one tab
    st.markdown("### 🔢 Random Bytes")
    with st.container():
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
    
    st.markdown('<div class="section-divider"></div>', unsafe_allow_html=True)
    
    # Cryptographic Keys
    st.markdown("### 🔑 Cryptographic Keys")
    with st.container():
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
    
    st.markdown('<div class="section-divider"></div>', unsafe_allow_html=True)
    
    # Session Tokens
    st.markdown("### 🎫 Session Tokens")
    with st.container():
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
    
    st.markdown('<div class="section-divider"></div>', unsafe_allow_html=True)
    
    # UUIDs
    st.markdown("### 🆔 Quantum UUIDs")
    with st.container():
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
    
    st.markdown('<div class="section-divider"></div>', unsafe_allow_html=True)
    
    # Passwords
    st.markdown("### 🔐 Secure Passwords")
    with st.container():
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
# TAB 2: BLOCKCHAIN SECURITY
# ============================================================================
with main_tab2:
    st.header("⛓️ Blockchain Quantum Security Demo")
    st.write("Demonstrate quantum threats to blockchain and quantum-safe alternatives")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("💼 Create Blockchain Wallet")
        wallet_type = st.radio("Wallet Type", ["both", "vulnerable", "quantum-safe"], key="wallet_type")
        
        if st.button("Create Wallet", key="btn_wallet", use_container_width=True):
            with st.spinner("Creating wallet..."):
                result, error = api_call_form("/blockchain/create-wallet", {"wallet_type": wallet_type})
                
                if result and result.get("data"):
                    st.success("✅ Wallet(s) created!")
                    
                    if "vulnerable" in result["data"]:
                        st.error("⚠️ **Vulnerable Wallet (RSA-2048)**")
                        st.write(f"Address: `{result['data']['vulnerable']['address'][:40]}...`")
                        st.write(f"Algorithm: {result['data']['vulnerable']['algorithm']}")
                        st.write(f"❌ Quantum Resistant: {result['data']['vulnerable']['quantum_resistant']}")
                        with st.expander("⚠️ Vulnerability Details"):
                            vuln = result['data']['vulnerable']['vulnerability']
                            st.write(f"**Shor's Algorithm:** {vuln['shor_algorithm']}")
                            st.write(f"**Time to Break:** {vuln['time_to_break']}")
                            st.write(f"**Risk Level:** {vuln['risk_level']}")
                    
                    if "quantum_safe" in result["data"]:
                        st.success("✅ **Quantum-Safe Wallet (DILITHIUM3)**")
                        st.write(f"Address: `{result['data']['quantum_safe']['address'][:40]}...`")
                        st.write(f"Algorithm: {result['data']['quantum_safe']['algorithm']}")
                        st.write(f"✅ Quantum Resistant: {result['data']['quantum_safe']['quantum_resistant']}")
                        with st.expander("🛡️ Security Details"):
                            sec = result['data']['quantum_safe']['security']
                            st.write(f"**Shor's Algorithm:** {sec['shor_algorithm']}")
                            st.write(f"**Time to Break:** {sec['time_to_break']}")
                            st.write(f"**NIST Level:** {sec['nist_level']}")
                else:
                    st.error(f"❌ {error}")
    
    with col2:
        st.subheader("⚡ Simulate Quantum Attack")
        attack_target = st.selectbox("Target Algorithm", 
                                     ["RSA-2048", "RSA-4096", "ECDSA-256", "DILITHIUM3"],
                                     key="attack_target")
        show_timeline = st.checkbox("Show timeline", value=True, key="show_timeline")
        
        if st.button("Run Attack Simulation", key="btn_attack", use_container_width=True):
            with st.spinner("Simulating quantum attack..."):
                result, error = api_call_form("/blockchain/simulate-attack", {
                    "target": attack_target,
                    "show_timeline": show_timeline
                })
                
                if result and result.get("data"):
                    sim = result["data"]["simulation"]
                    
                    if sim["result"]["status"] == "ATTACK SUCCESSFUL":
                        st.error(f"🚨 **{sim['result']['status']}**")
                        st.write(f"**Time Taken:** {sim['result'].get('time_taken', 'N/A')}")
                        st.write(f"**Private Key Extracted:** {sim['result']['private_key_extracted']}")
                        
                        with st.expander("💥 Impact Analysis"):
                            for key, value in sim["result"]["impact"].items():
                                st.write(f"• **{key.replace('_', ' ').title()}:** {value}")
                    else:
                        st.success(f"✅ **{sim['result']['status']}**")
                        st.write(f"**Reason:** {sim['result']['reason']}")
                        st.write(f"**Time to Break:** {sim['result']['security']['time_to_break']}")
                    
                    with st.expander("📋 Attack Phases"):
                        for phase in sim["attack_phases"]:
                            st.write(f"**Phase {phase['phase']}: {phase['name']}**")
                            st.write(f"  {phase['description']}")
                            st.write(f"  Time: {phase.get('time', 'N/A')}")
                    
                    if show_timeline and "timeline" in result["data"]:
                        with st.expander("📅 Quantum Computing Timeline"):
                            for year, event in result["data"]["timeline"].items():
                                st.write(f"**{year}:** {event}")
                else:
                    st.error(f"❌ {error}")
    
    st.markdown("---")
    st.subheader("📊 Blockchain Comparison")
    
    if st.button("Compare Vulnerable vs Quantum-Safe", key="btn_compare", use_container_width=True):
        with st.spinner("Comparing blockchains..."):
            result = requests.get(f"{API_BASE_URL}/blockchain/compare-blockchains").json()
            
            if result:
                col1, col2 = st.columns(2)
                
                with col1:
                    st.error("**⚠️ Vulnerable Blockchain**")
                    vuln = result.get("vulnerable_blockchain", {})
                    st.write(f"Algorithm: {vuln.get('signature_algorithm', 'N/A')}")
                    st.write(f"Quantum Resistant: ❌")
                    if "vulnerability" in vuln:
                        st.write(f"Risk: {vuln['vulnerability'].get('risk_level', 'N/A')}")
                        st.write(f"Time to break: {vuln['vulnerability'].get('time_to_break', 'N/A')}")
                
                with col2:
                    st.success("**✅ Quantum-Safe Blockchain**")
                    safe = result.get("quantum_safe_blockchain", {})
                    st.write(f"Algorithm: {safe.get('signature_algorithm', 'N/A')}")
                    st.write(f"Quantum Resistant: ✅")
                    if "security" in safe:
                        st.write(f"Protection: {safe['security'].get('shor_algorithm', 'N/A')}")
                        st.write(f"Future proof: {safe['security'].get('future_proof', 'N/A')}")

# ============================================================================
# TAB 3: POST-QUANTUM CRYPTOGRAPHY
# ============================================================================
with main_tab3:
    st.header("🔮 Post-Quantum Cryptography")
    st.write("NIST-standardized quantum-resistant algorithms")
    
    col1, col2 = st.columns([2, 1])
    
    with col1:
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
        
        st.markdown("---")
        
        st.subheader("⚠️ Quantum Threat Assessment")
        
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
st.markdown("---")
col1, col2, col3 = st.columns(3)
with col1:
    st.markdown("**🔮 QCrypt RNG v2.0**")
with col2:
    st.markdown("**📚 [API Docs](http://localhost:8000/docs)**")
with col3:
    st.markdown("**🔬 Powered by Quantum Mechanics**")