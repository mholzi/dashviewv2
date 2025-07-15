"""
Tests for the enhanced entity analyzer.
"""

import pytest
from unittest.mock import Mock, patch
from datetime import datetime, timedelta
from custom_components.dashview_v2.backend.intelligence.analyzer import (
    EntityAnalyzer, AreaInfo, HomeComplexity
)


class TestEntityAnalyzer:
    """Test suite for EntityAnalyzer."""
    
    @pytest.fixture
    def analyzer(self, mock_hass):
        """Create analyzer instance."""
        return EntityAnalyzer(mock_hass)
    
    def test_analyze_entities(self, analyzer, mock_hass):
        """Test entity analysis."""
        result = analyzer.analyze_entities()
        
        assert result["total_entities"] == 3
        assert "light" in result["domains"]
        assert result["domains"]["light"] == 1
        assert "sensor" in result["domains"]
        assert result["domains"]["sensor"] == 1
        assert "switch" in result["domains"]
        assert result["domains"]["switch"] == 1
    
    def test_analyze_areas(self, analyzer, mock_hass):
        """Test area analysis."""
        # Mock entity to area mapping
        mock_hass.helpers.entity_registry.async_get = Mock(side_effect=lambda eid: {
            "light.living_room": Mock(area_id="living_room"),
            "sensor.living_room_temperature": Mock(area_id="living_room"),
            "switch.bedroom_fan": Mock(area_id="bedroom")
        }.get(eid))
        
        areas = analyzer.analyze_areas()
        
        assert len(areas) == 3  # 3 areas defined in mock
        
        # Find living room
        living_room = next((a for a in areas if a.area_id == "living_room"), None)
        assert living_room is not None
        assert living_room.name == "Living Room"
        assert len(living_room.entities) == 2
        assert "light.living_room" in living_room.entities
    
    def test_group_entities_by_area(self, analyzer, mock_hass):
        """Test grouping entities by area."""
        # Mock entity to area mapping
        mock_hass.helpers.entity_registry.async_get = Mock(side_effect=lambda eid: {
            "light.living_room": Mock(area_id="living_room"),
            "sensor.living_room_temperature": Mock(area_id="living_room"),
            "switch.bedroom_fan": Mock(area_id="bedroom")
        }.get(eid))
        
        groups = analyzer.group_entities_by_area()
        
        assert "living_room" in groups
        assert len(groups["living_room"]) == 2
        assert "bedroom" in groups
        assert len(groups["bedroom"]) == 1
        assert None in groups  # Unassigned entities
    
    def test_find_unassigned_entities(self, analyzer, mock_hass):
        """Test finding unassigned entities."""
        # Mock some entities without areas
        mock_hass.helpers.entity_registry.async_get = Mock(side_effect=lambda eid: {
            "light.living_room": Mock(area_id="living_room"),
            "sensor.living_room_temperature": None,  # No area
            "switch.bedroom_fan": Mock(area_id=None)  # Explicitly no area
        }.get(eid))
        
        unassigned = analyzer.find_unassigned_entities()
        
        assert len(unassigned) >= 1  # At least one unassigned
        assert any("temperature" in e for e in unassigned)
    
    def test_get_home_complexity(self, analyzer, mock_hass):
        """Test home complexity calculation."""
        complexity = analyzer.get_home_complexity()
        
        assert complexity == HomeComplexity.SIMPLE  # Only 3 entities in mock
        
        # Test with more entities
        many_entities = [Mock(entity_id=f"sensor.test_{i}") for i in range(150)]
        mock_hass.states.async_all.return_value = many_entities
        
        complexity = analyzer.get_home_complexity()
        assert complexity == HomeComplexity.MEDIUM
    
    def test_calculate_complexity_score(self, analyzer, mock_hass):
        """Test complexity score calculation."""
        score = analyzer.calculate_complexity_score()
        
        assert isinstance(score, int)
        assert 1 <= score <= 10
        
        # With 3 entities and 3 areas, should be low complexity
        assert score <= 3
    
    def test_get_entity_usage_patterns(self, analyzer, mock_hass):
        """Test entity usage pattern detection."""
        # Mock state history
        now = datetime.now()
        history = [
            Mock(state="on", last_changed=now - timedelta(hours=1)),
            Mock(state="off", last_changed=now - timedelta(hours=2)),
            Mock(state="on", last_changed=now - timedelta(hours=3)),
        ]
        
        with patch.object(analyzer, '_get_state_history', return_value=history):
            patterns = analyzer.get_entity_usage_patterns("light.living_room")
            
            assert patterns["change_frequency"] > 0
            assert patterns["active_hours"] > 0
            assert "peak_usage_time" in patterns
    
    def test_suggest_dashboard_layout(self, analyzer, mock_hass):
        """Test dashboard layout suggestions."""
        suggestions = analyzer.suggest_dashboard_layout()
        
        assert "layout_type" in suggestions
        assert suggestions["layout_type"] == "simple"  # With few entities
        assert "recommended_widgets" in suggestions
        assert isinstance(suggestions["recommended_widgets"], list)
        assert "room" in suggestions["recommended_widgets"]  # Should suggest room widgets