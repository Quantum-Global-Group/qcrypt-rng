"""
Unit tests for Quantum Hardware Interface

Tests for ID Quantique, QuintessenceLabs, and other hardware adapters.
"""

import pytest
import asyncio
from unittest.mock import Mock, patch, MagicMock, AsyncMock
import sys
from pathlib import Path
import time

sys.path.append(str(Path(__file__).parent.parent.parent))

from app.quantum.hardware_interface import (
    QuantumDeviceType,
    QuantumMeasurement,
    QuantumHardwareInterface,
    PhotonicQRNG,
    SuperconductingQRNG,
    SimulatedQRNG,
    IDQuantiqueQRNG,
    QuintessenceLabsQRNG,
    QuantumHardwareManager,
    get_quantum_hardware_manager
)


class TestQuantumMeasurement:
    """Test QuantumMeasurement dataclass"""

    def test_measurement_creation(self):
        """Test creating a measurement"""
        measurement = QuantumMeasurement(
            value=42,
            bits=8,
            timestamp=time.time(),
            device_id="test_device",
            raw_data=b'\x2a',
            confidence=0.95
        )

        assert measurement.value == 42
        assert measurement.bits == 8
        assert measurement.device_id == "test_device"
        assert measurement.confidence == 0.95
        assert len(measurement.raw_data) == 1


@pytest.mark.asyncio
class TestSimulatedQRNG:
    """Tests for SimulatedQRNG"""

    @pytest.fixture
    def sim_qrng(self):
        """Create simulated QRNG"""
        return SimulatedQRNG(backend="qrisp")

    async def test_initialization(self, sim_qrng):
        """Test simulated QRNG initialization"""
        result = await sim_qrng.initialize()
        assert result is True
        assert sim_qrng.is_connected is True

    async def test_measure_qubits(self, sim_qrng):
        """Test qubit measurement"""
        await sim_qrng.initialize()
        measurement = await sim_qrng.measure_qubits(64)

        assert isinstance(measurement, QuantumMeasurement)
        assert measurement.bits == 64
        assert len(measurement.raw_data) == 8  # 64 bits = 8 bytes
        assert measurement.device_id.startswith("sim_")
        assert measurement.confidence > 0

    async def test_get_device_status(self, sim_qrng):
        """Test device status"""
        status = await sim_qrng.get_device_status()

        assert status["status"] == "operational"
        assert status["device_type"] == QuantumDeviceType.SIMULATOR.value
        assert status["is_real_hardware"] is False

    async def test_calibration(self, sim_qrng):
        """Test calibration"""
        result = await sim_qrng.calibrate()
        assert result is True
        assert sim_qrng.last_calibration is not None


@pytest.mark.asyncio
class TestPhotonicQRNG:
    """Tests for PhotonicQRNG"""

    @pytest.fixture
    def photonic_qrng(self):
        """Create photonic QRNG"""
        return PhotonicQRNG(device_address="usb://0")

    async def test_initialization(self, photonic_qrng):
        """Test photonic QRNG initialization"""
        result = await photonic_qrng.initialize()
        assert result is True
        assert photonic_qrng.is_connected is True

    async def test_measure_qubits(self, photonic_qrng):
        """Test qubit measurement"""
        await photonic_qrng.initialize()
        measurement = await photonic_qrng.measure_qubits(128)

        assert isinstance(measurement, QuantumMeasurement)
        assert measurement.bits == 128
        assert len(measurement.raw_data) == 16  # 128 bits = 16 bytes
        assert measurement.confidence == 0.98

    async def test_get_device_status(self, photonic_qrng):
        """Test device status"""
        await photonic_qrng.initialize()
        status = await photonic_qrng.get_device_status()

        assert status["status"] == "operational"
        assert status["device_type"] == QuantumDeviceType.PHOTONIC.value
        assert "generation_rate_bps" in status
        assert status["generation_rate_bps"] == 4_000_000

    async def test_disconnected_measurement(self, photonic_qrng):
        """Test measurement when disconnected"""
        with pytest.raises(RuntimeError, match="not connected"):
            await photonic_qrng.measure_qubits(64)


@pytest.mark.asyncio
class TestSuperconductingQRNG:
    """Tests for SuperconductingQRNG"""

    @pytest.fixture
    def sc_qrng(self):
        """Create superconducting QRNG"""
        return SuperconductingQRNG(device_address="tcp://localhost:8080")

    async def test_initialization(self, sc_qrng):
        """Test superconducting QRNG initialization"""
        result = await sc_qrng.initialize()
        assert result is True
        assert sc_qrng.is_connected is True

    async def test_measure_qubits(self, sc_qrng):
        """Test qubit measurement"""
        await sc_qrng.initialize()
        measurement = await sc_qrng.measure_qubits(256)

        assert isinstance(measurement, QuantumMeasurement)
        assert measurement.bits == 256
        assert len(measurement.raw_data) == 32  # 256 bits = 32 bytes
        assert measurement.confidence == 0.99

    async def test_device_status(self, sc_qrng):
        """Test device status"""
        await sc_qrng.initialize()
        status = await sc_qrng.get_device_status()

        assert status["status"] == "operational"
        assert status["device_type"] == QuantumDeviceType.SUPERCONDUCTING.value
        assert status["temperature"] == 0.1  # Near absolute zero
        assert status["generation_rate_bps"] == 10_000_000


@pytest.mark.asyncio
class TestIDQuantiqueQRNG:
    """Tests for IDQuantiqueQRNG"""

    @pytest.fixture
    def idq_qrng(self):
        """Create ID Quantique QRNG"""
        return IDQuantiqueQRNG(device_address="usb://0", device_type="usb")

    async def test_initialization(self, idq_qrng):
        """Test ID Quantique initialization"""
        result = await idq_qrng.initialize()
        assert result is True
        assert idq_qrng.is_connected is True
        assert idq_qrng.device_id.startswith("idq_")

    async def test_measure_qubits(self, idq_qrng):
        """Test qubit measurement"""
        await idq_qrng.initialize()
        measurement = await idq_qrng.measure_qubits(512)

        assert isinstance(measurement, QuantumMeasurement)
        assert measurement.bits == 512
        assert len(measurement.raw_data) == 64  # 512 bits = 64 bytes
        assert measurement.confidence == 0.99

    async def test_device_status(self, idq_qrng):
        """Test device status"""
        await idq_qrng.initialize()
        status = await idq_qrng.get_device_status()

        assert status["status"] == "operational"
        assert status["vendor"] == "ID Quantique"
        assert status["model"] == "Quantis"
        assert status["device_type"] == QuantumDeviceType.PHOTONIC.value

    async def test_calibration(self, idq_qrng):
        """Test calibration"""
        result = await idq_qrng.calibrate()
        assert result is True
        assert idq_qrng.last_calibration is not None


@pytest.mark.asyncio
class TestQuintessenceLabsQRNG:
    """Tests for QuintessenceLabsQRNG"""

    @pytest.fixture
    def qlabs_qrng(self):
        """Create QuintessenceLabs QRNG"""
        return QuintessenceLabsQRNG(
            device_address="tcp://localhost:8888",
            api_key="test_api_key"
        )

    async def test_initialization(self, qlabs_qrng):
        """Test QuintessenceLabs initialization"""
        result = await qlabs_qrng.initialize()
        assert result is True
        assert qlabs_qrng.is_connected is True
        assert qlabs_qrng.device_id.startswith("qlabs_")

    async def test_measure_qubits(self, qlabs_qrng):
        """Test qubit measurement"""
        await qlabs_qrng.initialize()
        measurement = await qlabs_qrng.measure_qubits(1024)

        assert isinstance(measurement, QuantumMeasurement)
        assert measurement.bits == 1024
        assert len(measurement.raw_data) == 128  # 1024 bits = 128 bytes
        assert measurement.confidence == 0.995

    async def test_device_status(self, qlabs_qrng):
        """Test device status"""
        await qlabs_qrng.initialize()
        status = await qlabs_qrng.get_device_status()

        assert status["status"] == "operational"
        assert status["vendor"] == "QuintessenceLabs"
        assert status["model"] == "qStream"
        assert status["generation_rate_bps"] == 64_000_000


class TestQuantumHardwareManager:
    """Tests for QuantumHardwareManager"""

    @pytest.fixture
    def hw_manager(self):
        """Create hardware manager"""
        return QuantumHardwareManager()

    @pytest.mark.asyncio
    async def test_add_device(self, hw_manager):
        """Test adding a device"""
        device = SimulatedQRNG(backend="test")
        result = await hw_manager.add_device("test_device", device)

        assert result is True
        assert "test_device" in hw_manager.devices
        assert hw_manager.active_device_id == "test_device"

    @pytest.mark.asyncio
    async def test_add_duplicate_device(self, hw_manager):
        """Test adding duplicate device"""
        device = SimulatedQRNG(backend="test")
        await hw_manager.add_device("test_device", device)

        # Try to add again
        result = await hw_manager.add_device("test_device", device)
        assert result is False

    @pytest.mark.asyncio
    async def test_remove_device(self, hw_manager):
        """Test removing a device"""
        device = SimulatedQRNG(backend="test")
        await hw_manager.add_device("test_device", device)

        result = await hw_manager.remove_device("test_device")
        assert result is True
        assert "test_device" not in hw_manager.devices

    @pytest.mark.asyncio
    async def test_measure_qubits(self, hw_manager):
        """Test measurement through manager"""
        device = SimulatedQRNG(backend="test")
        await hw_manager.add_device("test_device", device)

        measurement = await hw_manager.measure_qubits(64)

        assert isinstance(measurement, QuantumMeasurement)
        assert measurement.bits == 64

    @pytest.mark.asyncio
    async def test_measure_no_devices(self, hw_manager):
        """Test measurement with no devices"""
        with pytest.raises(RuntimeError, match="No quantum devices"):
            await hw_manager.measure_qubits(64)

    @pytest.mark.asyncio
    async def test_get_device_status(self, hw_manager):
        """Test getting device status"""
        device = SimulatedQRNG(backend="test")
        await hw_manager.add_device("test_device", device)

        status = await hw_manager.get_device_status("test_device")
        assert status["status"] == "operational"

    @pytest.mark.asyncio
    async def test_get_all_statuses(self, hw_manager):
        """Test getting all device statuses"""
        device1 = SimulatedQRNG(backend="test1")
        device2 = SimulatedQRNG(backend="test2")

        await hw_manager.add_device("device1", device1)
        await hw_manager.add_device("device2", device2)

        statuses = await hw_manager.get_device_status()

        assert "device1" in statuses
        assert "device2" in statuses

    @pytest.mark.asyncio
    async def test_calibrate_device(self, hw_manager):
        """Test device calibration"""
        device = SimulatedQRNG(backend="test")
        await hw_manager.add_device("test_device", device)

        result = await hw_manager.calibrate_device("test_device")
        assert result is True

    @pytest.mark.asyncio
    async def test_set_active_device(self, hw_manager):
        """Test setting active device"""
        device1 = SimulatedQRNG(backend="test1")
        device2 = SimulatedQRNG(backend="test2")

        await hw_manager.add_device("device1", device1)
        await hw_manager.add_device("device2", device2)

        result = hw_manager.set_active_device("device2")
        assert result is True
        assert hw_manager.active_device_id == "device2"

    @pytest.mark.asyncio
    async def test_run_entropy_quality_checks(self, hw_manager):
        """Test entropy quality checks"""
        device = SimulatedQRNG(backend="test")
        await hw_manager.add_device("test_device", device)

        quality = await hw_manager.run_entropy_quality_checks("test_device")

        assert "device_id" in quality
        assert "sample_size_bytes" in quality
        assert "chi_square" in quality
        assert "shannon_entropy" in quality
        assert "min_entropy" in quality
        assert "overall_quality" in quality
        assert quality["device_id"] == "test_device"

    @pytest.mark.asyncio
    async def test_run_entropy_checks_no_device(self, hw_manager):
        """Test entropy checks with no device"""
        with pytest.raises(ValueError, match="No valid device"):
            await hw_manager.run_entropy_quality_checks()


@pytest.mark.asyncio
class TestHardwareManagerMultipleDevices:
    """Tests for managing multiple hardware devices"""

    @pytest.fixture
    def hw_manager(self):
        """Create hardware manager with multiple devices"""
        manager = QuantumHardwareManager()

        # Add different types of devices
        sim_device = SimulatedQRNG(backend="qrisp")
        photonic_device = PhotonicQRNG(device_address="usb://0")
        sc_device = SuperconductingQRNG(device_address="tcp://localhost")

        asyncio.get_event_loop().run_until_complete(
            asyncio.gather(
                manager.add_device("sim", sim_device),
                manager.add_device("photonic", photonic_device),
                manager.add_device("superconducting", sc_device)
            )
        )

        return manager

    async def test_available_devices(self, hw_manager):
        """Test listing available devices"""
        devices = hw_manager.get_available_devices()

        assert len(devices) == 3
        assert "sim" in devices
        assert "photonic" in devices
        assert "superconducting" in devices

    async def test_switch_active_device(self, hw_manager):
        """Test switching active device"""
        assert hw_manager.active_device_id == "sim"  # First added

        hw_manager.set_active_device("photonic")
        assert hw_manager.active_device_id == "photonic"

        hw_manager.set_active_device("superconducting")
        assert hw_manager.active_device_id == "superconducting"

    async def test_measure_from_specific_device(self, hw_manager):
        """Test measuring from specific device"""
        measurement = await hw_manager.measure_qubits(64, "photonic")

        assert isinstance(measurement, QuantumMeasurement)
        assert measurement.device_id.startswith("photon_")

    async def test_remove_active_device(self, hw_manager):
        """Test removing active device"""
        await hw_manager.remove_device("sim")

        # Active device should change
        assert hw_manager.active_device_id != "sim"
        assert hw_manager.active_device_id in ["photonic", "superconducting"]


class TestSingletonPattern:
    """Test singleton pattern for hardware manager"""

    def test_get_quantum_hardware_manager(self):
        """Test singleton returns same instance"""
        manager1 = get_quantum_hardware_manager()
        manager2 = get_quantum_hardware_manager()

        assert manager1 is manager2


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
