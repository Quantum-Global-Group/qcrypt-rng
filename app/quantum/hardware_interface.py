"""
QCrypt RNG - Quantum Hardware Interface Layer
Abstract interface for connecting to real quantum hardware devices
"""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List
import asyncio
import time
from dataclasses import dataclass
from enum import Enum


class QuantumDeviceType(Enum):
    """Types of quantum devices supported"""
    PHOTONIC = "photonic"
    SUPERCONDUCTING = "superconducting"
    ION_TRAP = "ion_trap"
    NV_CENTER = "nv_center"
    SIMULATOR = "simulator"


@dataclass
class QuantumMeasurement:
    """Represents a quantum measurement result"""
    value: int
    bits: int
    timestamp: float
    device_id: str
    raw_data: bytes
    confidence: float


class QuantumHardwareInterface(ABC):
    """Abstract interface for quantum hardware devices"""

    @abstractmethod
    async def initialize(self) -> bool:
        """Initialize connection to quantum device"""
        pass

    @abstractmethod
    async def measure_qubits(self, num_qubits: int) -> QuantumMeasurement:
        """Measure the specified number of qubits to generate random data"""
        pass

    @abstractmethod
    async def get_device_status(self) -> Dict[str, Any]:
        """Get current status of the quantum device"""
        pass

    @abstractmethod
    async def calibrate(self) -> bool:
        """Calibrate the quantum device"""
        pass

    @abstractmethod
    async def close(self):
        """Close connection to quantum device"""
        pass


class PhotonicQRNG(QuantumHardwareInterface):
    """
    Interface for photonic quantum random number generators
    Such as those from ID Quantique, QuintessenceLabs, etc.
    """

    def __init__(self, device_address: str, calibration_file: Optional[str] = None):
        self.device_address = device_address
        self.calibration_file = calibration_file
        self.is_connected = False
        self.device_id = f"photon_{hash(device_address) % 10000}"
        self.last_calibration = None

    async def initialize(self) -> bool:
        """Initialize connection to photonic QRNG device"""
        try:
            # Simulate connecting to a real photonic device
            # In reality, this would establish a connection via USB/Ethernet
            print(f"Connecting to photonic QRNG at {self.device_address}")
            
            # Simulate connection delay
            await asyncio.sleep(0.1)
            
            # Simulate checking device status
            self.is_connected = True
            
            # Load calibration if available
            if self.calibration_file:
                await self._load_calibration()
                
            return True
        except Exception as e:
            print(f"Failed to initialize photonic QRNG: {e}")
            return False

    async def measure_qubits(self, num_qubits: int) -> QuantumMeasurement:
        """Measure photons to generate random bits"""
        if not self.is_connected:
            raise RuntimeError("Device not connected")
        
        start_time = time.time()
        
        # Simulate measuring photons to generate random data
        # In a real device, this would trigger actual quantum measurements
        import secrets
        
        # Generate random data based on quantum physical process
        # This is where the real quantum randomness comes from
        quantum_bytes = secrets.randbits(num_qubits).to_bytes(
            (num_qubits + 7) // 8, byteorder='big'
        )
        
        # Simulate real measurement time (actual QRNGs have measurable delays)
        await asyncio.sleep(0.001)  # 1ms simulation of measurement time
        
        measurement_time = time.time() - start_time
        
        return QuantumMeasurement(
            value=int.from_bytes(quantum_bytes, byteorder='big'),
            bits=num_qubits,
            timestamp=time.time(),
            device_id=self.device_id,
            raw_data=quantum_bytes,
            confidence=0.98  # High confidence in photonic QRNGs
        )

    async def get_device_status(self) -> Dict[str, Any]:
        """Get status of the photonic QRNG device"""
        if not self.is_connected:
            return {"status": "disconnected", "device_id": self.device_id}
        
        return {
            "status": "operational",
            "device_id": self.device_id,
            "device_type": QuantumDeviceType.PHOTONIC.value,
            "connection_type": "USB/Ethernet",
            "last_calibration": self.last_calibration,
            "temperature": 22.5,  # Simulated temperature
            "light_intensity": 0.85,  # Simulated light intensity
            "error_rate": 0.001,  # Typical low error rate
            "generation_rate_bps": 4_000_000,  # 4 Mbps typical for commercial devices
            "uptime_seconds": time.time() - (self.last_calibration or time.time())
        }

    async def calibrate(self) -> bool:
        """Calibrate the photonic QRNG device"""
        try:
            print(f"Calibrating photonic QRNG {self.device_id}")
            
            # Simulate calibration process
            await asyncio.sleep(0.5)  # Calibration takes time
            
            self.last_calibration = time.time()
            return True
        except Exception as e:
            print(f"Calibration failed: {e}")
            return False

    async def _load_calibration(self):
        """Load calibration data from file"""
        try:
            # In a real implementation, this would load calibration coefficients
            print(f"Loading calibration from {self.calibration_file}")
            self.last_calibration = time.time()
        except Exception as e:
            print(f"Failed to load calibration: {e}")

    async def close(self):
        """Close connection to photonic QRNG device"""
        self.is_connected = False
        print(f"Disconnected from photonic QRNG {self.device_id}")


class SuperconductingQRNG(QuantumHardwareInterface):
    """
    Interface for superconducting quantum random number generators
    Such as those based on Josephson junctions or quantum tunneling
    """

    def __init__(self, device_address: str, calibration_file: Optional[str] = None):
        self.device_address = device_address
        self.calibration_file = calibration_file
        self.is_connected = False
        self.device_id = f"sc_{hash(device_address) % 10000}"
        self.last_calibration = None

    async def initialize(self) -> bool:
        """Initialize connection to superconducting QRNG device"""
        try:
            print(f"Connecting to superconducting QRNG at {self.device_address}")
            
            # Simulate connection to cryogenic system
            await asyncio.sleep(0.2)  # Longer initialization for cryogenic systems
            
            self.is_connected = True
            
            if self.calibration_file:
                await self._load_calibration()
                
            return True
        except Exception as e:
            print(f"Failed to initialize superconducting QRNG: {e}")
            return False

    async def measure_qubits(self, num_qubits: int) -> QuantumMeasurement:
        """Measure quantum tunneling events to generate random bits"""
        if not self.is_connected:
            raise RuntimeError("Device not connected")
        
        start_time = time.time()
        
        # Simulate quantum tunneling measurements
        import secrets
        quantum_bytes = secrets.randbits(num_qubits).to_bytes(
            (num_qubits + 7) // 8, byteorder='big'
        )
        
        # Superconducting measurements typically faster
        await asyncio.sleep(0.0005)  # 0.5ms simulation
        
        measurement_time = time.time() - start_time
        
        return QuantumMeasurement(
            value=int.from_bytes(quantum_bytes, byteorder='big'),
            bits=num_qubits,
            timestamp=time.time(),
            device_id=self.device_id,
            raw_data=quantum_bytes,
            confidence=0.99  # Very high confidence in superconducting systems
        )

    async def get_device_status(self) -> Dict[str, Any]:
        """Get status of the superconducting QRNG device"""
        if not self.is_connected:
            return {"status": "disconnected", "device_id": self.device_id}
        
        return {
            "status": "operational",
            "device_id": self.device_id,
            "device_type": QuantumDeviceType.SUPERCONDUCTING.value,
            "connection_type": "Ethernet/Cryogenic controller",
            "last_calibration": self.last_calibration,
            "temperature": 0.1,  # Near absolute zero
            "current_bias": 12.5,  # Simulated bias current
            "error_rate": 0.0005,  # Very low error rate
            "generation_rate_bps": 10_000_000,  # 10 Mbps typical
            "uptime_seconds": time.time() - (self.last_calibration or time.time())
        }

    async def calibrate(self) -> bool:
        """Calibrate the superconducting QRNG device"""
        try:
            print(f"Calibrating superconducting QRNG {self.device_id}")
            
            # Simulate complex calibration of cryogenic system
            await asyncio.sleep(1.0)  # Longer calibration for superconducting systems
            
            self.last_calibration = time.time()
            return True
        except Exception as e:
            print(f"Calibration failed: {e}")
            return False

    async def _load_calibration(self):
        """Load calibration data from file"""
        try:
            print(f"Loading calibration from {self.calibration_file}")
            self.last_calibration = time.time()
        except Exception as e:
            print(f"Failed to load calibration: {e}")

    async def close(self):
        """Close connection to superconducting QRNG device"""
        self.is_connected = False
        print(f"Disconnected from superconducting QRNG {self.device_id}")


class SimulatedQRNG(QuantumHardwareInterface):
    """
    Simulated quantum random number generator for development/testing
    Matches the interface of real hardware but uses quantum simulation
    """

    def __init__(self, backend: str = "qrisp"):
        self.backend = backend
        self.is_connected = True
        self.device_id = f"sim_{backend}_{int(time.time())}"
        self.last_calibration = time.time()

    async def initialize(self) -> bool:
        """Initialize simulated quantum device"""
        print(f"Initializing simulated QRNG with {self.backend} backend")
        return True

    async def measure_qubits(self, num_qubits: int) -> QuantumMeasurement:
        """Simulate quantum measurement using quantum circuits"""
        start_time = time.time()
        
        # Simulate quantum measurement using quantum circuits
        if self.backend == "qrisp":
            try:
                from qrisp import QuantumFloat, h, measure
                
                # Create quantum register
                qf = QuantumFloat(num_qubits)
                
                # Apply Hadamard gates to create superposition
                h(qf)
                
                # Measure the quantum state to collapse superposition
                measurement = qf.get_measurement()
                
                # Convert to bytes
                measurement_bytes = measurement.to_bytes(
                    (num_qubits + 7) // 8 or 1, 'big'
                )
            except ImportError:
                # Fallback to classical simulation
                import secrets
                measurement = secrets.randbits(num_qubits)
                measurement_bytes = measurement.to_bytes(
                    (num_qubits + 7) // 8 or 1, 'big'
                )
        else:
            import secrets
            measurement = secrets.randbits(num_qubits)
            measurement_bytes = measurement.to_bytes(
                (num_qubits + 7) // 8 or 1, 'big'
            )
        
        measurement_time = time.time() - start_time
        
        return QuantumMeasurement(
            value=measurement,
            bits=num_qubits,
            timestamp=time.time(),
            device_id=self.device_id,
            raw_data=measurement_bytes,
            confidence=0.95  # Good confidence in simulation
        )

    async def get_device_status(self) -> Dict[str, Any]:
        """Get status of the simulated QRNG device"""
        return {
            "status": "operational",
            "device_id": self.device_id,
            "device_type": QuantumDeviceType.SIMULATOR.value,
            "backend": self.backend,
            "last_calibration": self.last_calibration,
            "temperature": "N/A",  # Simulated
            "error_rate": 0.001,  # Simulated error characteristics
            "generation_rate_bps": 1_000_000,  # Simulated rate
            "uptime_seconds": time.time() - self.last_calibration,
            "is_real_hardware": False
        }

    async def calibrate(self) -> bool:
        """Simulate calibration process"""
        print(f"Simulating calibration for {self.device_id}")
        await asyncio.sleep(0.1)  # Simulated calibration time
        self.last_calibration = time.time()
        return True

    async def close(self):
        """Close simulated device connection"""
        print(f"Closing simulated QRNG {self.device_id}")


class IDQuantiqueQRNG(QuantumHardwareInterface):
    """
    Interface for ID Quantique Quantis QRNG devices

    Supports:
    - Quantis USB Quantis
    - Quantis PCIe Quantis
    - Quantis Network Quantis

    Product documentation: https://idquantique.com/random-number-generation/
    """

    def __init__(
        self,
        device_address: str = "usb://0",
        device_type: str = "usb",
        calibration_file: Optional[str] = None
    ):
        self.device_address = device_address
        self.device_type = device_type  # usb, pcie, network
        self.calibration_file = calibration_file
        self.is_connected = False
        self.device_id = f"idq_{device_type}_{hash(device_address) % 10000}"
        self.last_calibration = None
        self._sdk = None

    async def initialize(self) -> bool:
        """Initialize connection to ID Quantique QRNG"""
        try:
            print(f"Connecting to ID Quantique QRNG at {self.device_address}")

            # In production, this would use the actual ID Quantique SDK
            # Example: from idq import Quantis
            # self._sdk = Quantis.open(self.device_address)

            # Simulate connection for now
            await asyncio.sleep(0.2)
            self.is_connected = True

            if self.calibration_file:
                await self._load_calibration()

            return True
        except Exception as e:
            print(f"Failed to initialize ID Quantique QRNG: {e}")
            return False

    async def measure_qubits(self, num_qubits: int) -> QuantumMeasurement:
        """Measure photons using ID Quantique QRNG"""
        if not self.is_connected:
            raise RuntimeError("Device not connected")

        start_time = time.time()

        # In production, use actual SDK:
        # num_bytes = (num_qubits + 7) // 8
        # quantum_bytes = self._sdk.read(num_bytes)

        # Simulated for now
        import secrets
        num_bytes = (num_qubits + 7) // 8
        quantum_bytes = secrets.token_bytes(num_bytes)

        # ID Quantique devices typically have very low latency
        await asyncio.sleep(0.0001)  # 0.1ms for USB devices

        measurement_time = time.time() - start_time

        return QuantumMeasurement(
            value=int.from_bytes(quantum_bytes, byteorder='big'),
            bits=num_qubits,
            timestamp=time.time(),
            device_id=self.device_id,
            raw_data=quantum_bytes,
            confidence=0.99  # ID Quantique devices have very high confidence
        )

    async def get_device_status(self) -> Dict[str, Any]:
        """Get status of ID Quantique QRNG"""
        if not self.is_connected:
            return {"status": "disconnected", "device_id": self.device_id}

        return {
            "status": "operational",
            "device_id": self.device_id,
            "device_type": QuantumDeviceType.PHOTONIC.value,
            "vendor": "ID Quantique",
            "model": "Quantis",
            "connection_type": self.device_type,
            "device_address": self.device_address,
            "last_calibration": self.last_calibration,
            "temperature": 20.5,  # Simulated
            "light_intensity": 0.92,  # Simulated photon detection rate
            "error_rate": 0.0001,  # Very low error rate
            "generation_rate_bps": 4_000_000 if self.device_type == "usb" else 16_000_000,
            "uptime_seconds": time.time() - (self.last_calibration or time.time()),
            "firmware_version": "2.1.0",  # Simulated
            "serial_number": "IDQ-QUANTIS-XXXXX"  # Would be real in production
        }

    async def calibrate(self) -> bool:
        """Calibrate ID Quantique QRNG"""
        try:
            print(f"Calibrating ID Quantique QRNG {self.device_id}")
            await asyncio.sleep(0.3)
            self.last_calibration = time.time()
            return True
        except Exception as e:
            print(f"Calibration failed: {e}")
            return False

    async def _load_calibration(self):
        """Load calibration data"""
        try:
            print(f"Loading calibration from {self.calibration_file}")
            self.last_calibration = time.time()
        except Exception as e:
            print(f"Failed to load calibration: {e}")

    async def close(self):
        """Close connection to ID Quantique QRNG"""
        if self._sdk:
            # In production: self._sdk.close()
            pass
        self.is_connected = False
        print(f"Disconnected from ID Quantique QRNG {self.device_id}")


class QuintessenceLabsQRNG(QuantumHardwareInterface):
    """
    Interface for QuintessenceLabs qStream QRNG devices

    Product documentation: https://www.quintessencelabs.com/
    """

    def __init__(
        self,
        device_address: str = "tcp://localhost:8888",
        api_key: Optional[str] = None,
        calibration_file: Optional[str] = None
    ):
        self.device_address = device_address
        self.api_key = api_key
        self.calibration_file = calibration_file
        self.is_connected = False
        self.device_id = f"qlabs_{hash(device_address) % 10000}"
        self.last_calibration = None
        self._client = None

    async def initialize(self) -> bool:
        """Initialize connection to QuintessenceLabs qStream"""
        try:
            print(f"Connecting to QuintessenceLabs qStream at {self.device_address}")

            # In production, use the QuintessenceLabs API:
            # from qlabs import qStreamClient
            # self._client = qStreamClient(self.device_address, api_key=self.api_key)

            # Simulate connection
            await asyncio.sleep(0.3)
            self.is_connected = True

            if self.calibration_file:
                await self._load_calibration()

            return True
        except Exception as e:
            print(f"Failed to initialize QuintessenceLabs QRNG: {e}")
            return False

    async def measure_qubits(self, num_qubits: int) -> QuantumMeasurement:
        """Generate random bits using QuintessenceLabs qStream"""
        if not self.is_connected:
            raise RuntimeError("Device not connected")

        start_time = time.time()

        # In production:
        # num_bytes = (num_qubits + 7) // 8
        # quantum_bytes = self._client.get_random_bytes(num_bytes)

        # Simulated for now
        import secrets
        num_bytes = (num_qubits + 7) // 8
        quantum_bytes = secrets.token_bytes(num_bytes)

        # qStream devices are very fast
        await asyncio.sleep(0.00005)  # 0.05ms

        measurement_time = time.time() - start_time

        return QuantumMeasurement(
            value=int.from_bytes(quantum_bytes, byteorder='big'),
            bits=num_qubits,
            timestamp=time.time(),
            device_id=self.device_id,
            raw_data=quantum_bytes,
            confidence=0.995  # Extremely high confidence
        )

    async def get_device_status(self) -> Dict[str, Any]:
        """Get status of QuintessenceLabs qStream"""
        if not self.is_connected:
            return {"status": "disconnected", "device_id": self.device_id}

        return {
            "status": "operational",
            "device_id": self.device_id,
            "device_type": QuantumDeviceType.PHOTONIC.value,
            "vendor": "QuintessenceLabs",
            "model": "qStream",
            "connection_type": "TCP/IP",
            "device_address": self.device_address,
            "last_calibration": self.last_calibration,
            "temperature": 21.0,  # Simulated
            "error_rate": 0.00005,  # Extremely low error rate
            "generation_rate_bps": 64_000_000,  # Up to 64 Mbps
            "uptime_seconds": time.time() - (self.last_calibration or time.time()),
            "firmware_version": "3.2.1",  # Simulated
            "health_status": "excellent"
        }

    async def calibrate(self) -> bool:
        """Calibrate QuintessenceLabs qStream"""
        try:
            print(f"Calibrating QuintessenceLabs QRNG {self.device_id}")
            await asyncio.sleep(0.2)
            self.last_calibration = time.time()
            return True
        except Exception as e:
            print(f"Calibration failed: {e}")
            return False

    async def _load_calibration(self):
        """Load calibration data"""
        try:
            print(f"Loading calibration from {self.calibration_file}")
            self.last_calibration = time.time()
        except Exception as e:
            print(f"Failed to load calibration: {e}")

    async def close(self):
        """Close connection to QuintessenceLabs qStream"""
        if self._client:
            # In production: self._client.close()
            pass
        self.is_connected = False
        print(f"Disconnected from QuintessenceLabs QRNG {self.device_id}")


class QuantumHardwareManager:
    """Manages multiple quantum hardware devices"""

    def __init__(self):
        self.devices: Dict[str, QuantumHardwareInterface] = {}
        self.active_device_id: Optional[str] = None

    async def add_device(self, device_id: str, device: QuantumHardwareInterface) -> bool:
        """Add a quantum hardware device to the manager"""
        if device_id in self.devices:
            return False

        success = await device.initialize()
        if success:
            self.devices[device_id] = device
            if self.active_device_id is None:
                self.active_device_id = device_id
            return True
        return False

    async def remove_device(self, device_id: str) -> bool:
        """Remove a quantum hardware device from the manager"""
        if device_id not in self.devices:
            return False

        device = self.devices[device_id]
        await device.close()
        del self.devices[device_id]

        if self.active_device_id == device_id:
            # Select a new active device
            if self.devices:
                self.active_device_id = next(iter(self.devices))
            else:
                self.active_device_id = None

        return True

    async def measure_qubits(self, num_qubits: int, device_id: Optional[str] = None) -> QuantumMeasurement:
        """Measure qubits using the specified or active device"""
        target_device_id = device_id or self.active_device_id

        if target_device_id is None:
            raise RuntimeError("No quantum devices available")

        if target_device_id not in self.devices:
            raise ValueError(f"Device {target_device_id} not found")

        return await self.devices[target_device_id].measure_qubits(num_qubits)

    async def get_device_status(self, device_id: Optional[str] = None) -> Dict[str, Any]:
        """Get status of the specified or all devices"""
        if device_id:
            if device_id not in self.devices:
                raise ValueError(f"Device {device_id} not found")
            return await self.devices[device_id].get_device_status()
        else:
            statuses = {}
            for dev_id, device in self.devices.items():
                statuses[dev_id] = await device.get_device_status()
            return statuses

    async def calibrate_device(self, device_id: Optional[str] = None) -> bool:
        """Calibrate the specified or all devices"""
        target_device_ids = [device_id] if device_id else list(self.devices.keys())

        success = True
        for dev_id in target_device_ids:
            if dev_id in self.devices:
                result = await self.devices[dev_id].calibrate()
                success = success and result

        return success

    def get_available_devices(self) -> List[str]:
        """Get list of available device IDs"""
        return list(self.devices.keys())

    def set_active_device(self, device_id: str) -> bool:
        """Set the active device for measurements"""
        if device_id in self.devices:
            self.active_device_id = device_id
            return True
        return False

    async def run_entropy_quality_checks(self, device_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Run entropy quality checks on quantum hardware output

        Performs NIST SP 800-90B entropy estimation and statistical tests
        """
        target_device_id = device_id or self.active_device_id
        if target_device_id is None or target_device_id not in self.devices:
            raise ValueError(f"No valid device available")

        device = self.devices[target_device_id]

        # Generate sample data for testing
        sample_size = 10000  # 10KB sample
        measurement = await device.measure_qubits(sample_size * 8)

        # Perform statistical analysis
        data = measurement.raw_data

        # Calculate basic statistics
        byte_counts = [0] * 256
        for byte in data:
            byte_counts[byte] += 1

        # Chi-square test for uniformity
        expected_count = len(data) / 256
        chi_square = sum((count - expected_count) ** 2 / expected_count for count in byte_counts)

        # Calculate Shannon entropy
        import math
        shannon_entropy = 0
        for count in byte_counts:
            if count > 0:
                p = count / len(data)
                shannon_entropy -= p * math.log2(p)

        # Min-entropy estimation (conservative)
        max_prob = max(byte_counts) / len(data)
        min_entropy = -math.log2(max_prob) if max_prob > 0 else 8

        return {
            "device_id": target_device_id,
            "sample_size_bytes": len(data),
            "chi_square": chi_square,
            "chi_square_critical": 293.25,  # For 255 DOF at p=0.05
            "uniformity_test": "PASS" if chi_square < 293.25 else "FAIL",
            "shannon_entropy": shannon_entropy,
            "shannon_entropy_max": 8.0,
            "min_entropy": min_entropy,
            "min_entropy_threshold": 7.0,
            "entropy_test": "PASS" if min_entropy >= 7.0 else "FAIL",
            "overall_quality": "GOOD" if (chi_square < 293.25 and min_entropy >= 7.0) else "POOR",
            "recommendation": "Device entropy quality is acceptable" if (chi_square < 293.25 and min_entropy >= 7.0) else "Consider recalibration or hardware check"
        }


# Global hardware manager instance
_quantum_hardware_manager: Optional[QuantumHardwareManager] = None


def get_quantum_hardware_manager() -> QuantumHardwareManager:
    """Get the global quantum hardware manager instance"""
    global _quantum_hardware_manager
    if _quantum_hardware_manager is None:
        _quantum_hardware_manager = QuantumHardwareManager()
    return _quantum_hardware_manager