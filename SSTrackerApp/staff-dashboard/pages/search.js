import React, { useState, useCallback, useRef } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { searchGrSuggestions } from '../../utils/biltySearchService';
import styles from './styles/search.styles';

export default function StaffSearch() {
  const navigation = useNavigation();
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceTimer = useRef(null);

  const handleSearchChange = useCallback((text) => {
    setSearchText(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (text.trim().length < 2) {
      setSuggestions([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    debounceTimer.current = setTimeout(async () => {
      const result = await searchGrSuggestions(text.trim());
      setSuggestions(result.suggestions || []);
      setIsSearching(false);
      setHasSearched(true);
    }, 400);
  }, []);

  const handleSelectGr = (grNo) => {
    navigation.navigate('StaffBiltyDetails', { grNo });
  };

  const clearSearch = () => {
    setSearchText('');
    setSuggestions([]);
    setHasSearched(false);
  };

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#334155" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header */}
        <LinearGradient
          colors={['#475569', '#334155', '#1e293b']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Search Bilty</Text>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          </View>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Enter GR number..."
              placeholderTextColor="#94a3b8"
              value={searchText}
              onChangeText={handleSearchChange}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            {searchText.length > 0 && (
              <TouchableOpacity style={styles.clearBtn} onPress={clearSearch}>
                <Text style={styles.clearIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {isSearching && (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#475569" />
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          )}

          {!isSearching && suggestions.length > 0 && (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsLabel}>
                {suggestions.length} result{suggestions.length > 1 ? 's' : ''}
              </Text>
              {suggestions.map((item, idx) => (
                <TouchableOpacity
                  key={`${item.gr_no}-${idx}`}
                  style={[styles.resultCard, item.type === 'MANUAL' && styles.resultCardManual]}
                  onPress={() => handleSelectGr(item.gr_no)}
                  activeOpacity={0.7}
                >
                  <View style={styles.resultContent}>
                    <View style={styles.resultTopRow}>
                      <Text style={styles.resultGr}>{item.gr_no}</Text>
                      <View style={[styles.badge, item.type === 'MANUAL' ? styles.badgeManual : styles.badgeReg]}>
                        <Text style={[styles.badgeText, item.type === 'MANUAL' ? styles.badgeTextManual : styles.badgeTextReg]}>
                          {item.type === 'REG' ? 'REG' : 'MAN'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.resultParties} numberOfLines={1}>
                      {item.consignor}  →  {item.consignee}
                    </Text>
                    <Text style={styles.resultMeta}>
                      {formatDate(item.date)}{item.station ? `  ·  ${item.station}` : ''}
                    </Text>
                  </View>
                  <Text style={styles.resultArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {!isSearching && hasSearched && suggestions.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyTitle}>No bilty found</Text>
              <Text style={styles.emptySub}>Try a different GR number</Text>
            </View>
          )}

          {!hasSearched && !isSearching && searchText.length === 0 && (
            <View style={styles.emptyState}>
              <Image
                source={require('../../assets/images/logo.png')}
                style={styles.placeholderLogo}
                resizeMode="contain"
              />
              <Text style={styles.emptyTitle}>Search Any Bilty</Text>
              <Text style={styles.emptySub}>
                Type a GR number to search across regular and manual bilties
              </Text>
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
