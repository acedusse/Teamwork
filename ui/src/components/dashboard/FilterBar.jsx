import React from 'react';
import PropTypes from 'prop-types';
import { Box, TextField, InputAdornment, MenuItem, Select, FormControl, InputLabel, OutlinedInput, Chip, Stack } from '@mui/material';
import { Search } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

const priorities = ['critical', 'high', 'medium', 'low'];

const FilterBar = ({
  search,
  onSearchChange,
  assignees,
  selectedAssignees,
  onAssigneesChange,
  prioritiesList = priorities,
  selectedPriorities,
  onPrioritiesChange,
  tags,
  selectedTags,
  onTagsChange,
  dateRange,
  onDateRangeChange
}) => {
  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
      {/* Search Input */}
      <TextField
        size="small"
        placeholder="Search tasks..."
        value={search}
        onChange={e => onSearchChange(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          )
        }}
        sx={{ minWidth: 200 }}
      />

      {/* Assignee Filter */}
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>Assignee</InputLabel>
        <Select
          multiple
          value={selectedAssignees}
          onChange={e => onAssigneesChange(e.target.value)}
          input={<OutlinedInput label="Assignee" />}
          renderValue={selected => (
            <Stack direction="row" gap={0.5} flexWrap="wrap">
              {selected.map(val => (
                <Chip key={val} label={val} size="small" />
              ))}
            </Stack>
          )}
        >
          {assignees?.filter(Boolean).map(assignee => (
            <MenuItem key={assignee} value={assignee}>
              {String(assignee)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Priority Filter */}
      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel>Priority</InputLabel>
        <Select
          multiple
          value={selectedPriorities}
          onChange={e => onPrioritiesChange(e.target.value)}
          input={<OutlinedInput label="Priority" />}
          renderValue={selected => (
            <Stack direction="row" gap={0.5} flexWrap="wrap">
              {selected.map(val => (
                <Chip key={val} label={val} size="small" />
              ))}
            </Stack>
          )}
        >
          {prioritiesList?.filter(Boolean).map(priority => (
            <MenuItem key={priority} value={priority}>
              {String(priority)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Tag Filter */}
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>Tag</InputLabel>
        <Select
          multiple
          value={selectedTags}
          onChange={e => onTagsChange(e.target.value)}
          input={<OutlinedInput label="Tag" />}
          renderValue={selected => (
            <Stack direction="row" gap={0.5} flexWrap="wrap">
              {selected.map(val => (
                <Chip key={val} label={val} size="small" />
              ))}
            </Stack>
          )}
        >
          {tags?.filter(Boolean).map(tag => (
            <MenuItem key={tag} value={tag}>
              {String(tag)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Date Range Filter */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <DatePicker
          label="Start Date"
          value={dateRange[0]}
          onChange={date => onDateRangeChange([date, dateRange[1]])}
          slotProps={{ textField: { size: 'small', sx: { minWidth: 120 } } }}
        />
        <DatePicker
          label="End Date"
          value={dateRange[1]}
          onChange={date => onDateRangeChange([dateRange[0], date])}
          slotProps={{ textField: { size: 'small', sx: { minWidth: 120 } } }}
        />
      </Box>
    </Box>
  );
};

FilterBar.propTypes = {
  search: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  assignees: PropTypes.array.isRequired,
  selectedAssignees: PropTypes.array.isRequired,
  onAssigneesChange: PropTypes.func.isRequired,
  prioritiesList: PropTypes.array,
  selectedPriorities: PropTypes.array.isRequired,
  onPrioritiesChange: PropTypes.func.isRequired,
  tags: PropTypes.array.isRequired,
  selectedTags: PropTypes.array.isRequired,
  onTagsChange: PropTypes.func.isRequired,
  dateRange: PropTypes.array.isRequired,
  onDateRangeChange: PropTypes.func.isRequired
};

export default FilterBar; 