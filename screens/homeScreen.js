import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';
import { executeQuerySql,executeDMLSql } from '../components/database/database';
import { Picker } from '@react-native-picker/picker';

const HomeScreen = ({ route,navigation }) => {
  // State management
  const [journals, setJournals] = useState([]);
  const [category, setCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  // Categories for filtering
  const categories = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks'];

  // Initialize camera and load journals
  useEffect(() => {

    //logout user
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={{ paddingRight: 10 }}
          onPress={() => navigation.reset({
            index: 0,
            routes: [{ name: 'Auth' }],
          })}
        >
        <Text style={{ color: 'black', fontWeight: 'bold'}}>Logout</Text>
        </TouchableOpacity>
      ),
      });

    const initialize = async () => {
      console.log('Initializing ...');
      // Load journal entries
      await loadJournals();
      setIsLoading(false);
    };
    initialize();
  }, []);

  // Load journals from database
  const loadJournals = async () => {
    try {
      const userId = route.params?.userId;
      console.log('User ID:', userId);
      if (!userId) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      const result = await executeQuerySql(
        'SELECT * FROM journals WHERE userId = ? ORDER BY date DESC',
        [userId]
      );
      
      setJournals(result || []);
    } catch (error) {
      console.error('Error loading journals:', error);
      Alert.alert('Error', 'Failed to load journals');
    }
  };

  // edit journal entry
const editJournal = async (journalId, description, image, category) => {
  try {
    // 
    const userId = route.params?.userId;
    if (!userId) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }
    // check journalId 
    if (!journalId) {
      Alert.alert('Error', 'Invalid journal entry');
      return;
    }
    //
    navigation.navigate('JournalManager', {
      userId: userId,
      editingId: journalId,
      description: description,
      image: image,
      category: category,
    });
  } catch (error) {
    console.error('Edit error:', error);
    Alert.alert('Error', 'An unexpected error occurred');
  }
};

  // Delete journal entry
  const deleteJournal = async (id) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this journal entry?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await executeDMLSql(
                'DELETE FROM journals WHERE id = ?',
                [id]
              );
              await loadJournals();
              Alert.alert('Success', 'Journal deleted successfully');
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete journal');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };


  // Filter journals by category
  const filteredJournals = category === 'All'
    ? journals
    : journals.filter((item) => item.category === category);

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading your food journals...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
        {/* Journal List Section */}
        <View style={styles.listContainer}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10}}>
          <Text style={styles.sectionTitle}>Your Food Journals</Text>
          <TouchableOpacity
            style={{ paddingRight: 10 }}
            onPress={() => navigation.navigate('JournalManager', { userId: route.params?.userId })}
          >
            <Image source={require('../assets/add.png')} 
            style={{ width: 25, height: 25 }} />
          </TouchableOpacity>
          </View>
          
          {/* Category Filter */}
          <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>Filter by:</Text>
            <View style={styles.filterPickerWrapper}>
              <Picker
                selectedValue={category}
                onValueChange={(itemValue) => setCategory(itemValue)}
                style={styles.filterPicker}
              >
                {categories.map((cat) => (
                  <Picker.Item key={cat} label={cat} value={cat} />
                ))}
              </Picker>
            </View>
          </View>
          {/* Journal List */}
          {filteredJournals.length > 0 ? (
            <SwipeListView
              data={filteredJournals}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.journalItem}>
                  <Image source={{ uri: item.image }} style={styles.journalImage} />
                  <View style={styles.journalDetails}>
                    <Text style={styles.journalDescription}>
                      {item.description}
                    </Text>
                    <View style={styles.journalMeta}>
                      <Text style={styles.journalCategory}>
                        {item.category}
                      </Text>
                      <Text style={styles.journalDate}>
                        {new Date(item.date).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
              renderHiddenItem={({ item }) => (
                <View style={styles.hiddenButtons}>
                  <TouchableOpacity
                    style={[styles.hiddenButton, styles.editButton]}
                    onPress={() => {
                      editJournal(item.id, item.description, item.image, item.category);
                    }}
                  >
                    <Text style={styles.hiddenButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.hiddenButton, styles.deleteButton]}
                    onPress={() => deleteJournal(item.id)}
                  >
                    <Text style={styles.hiddenButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
              rightOpenValue={-150}
              disableRightSwipe
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {category === 'All'
                  ? 'No journal entries yet. Add your first entry above!'
                  : `No entries in ${category} category`}
              </Text>
            </View>
          )}
        </View>
    </KeyboardAvoidingView>
  );
};

// Styles remain the same as in your original code
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  listContainer: {
    flex: 1,
    backgroundColor: 'white',
    padding: 15,
    // margin: 15,
    // borderTopLeftRadius: 20,
    // borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  filterLabel: {
    marginRight: 10,
    fontSize: 16,
  },
  filterPickerWrapper: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
  },
  filterPicker: {
    height: 50,
  },
  journalItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    height: 100
  },
  journalImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  journalDetails: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  journalDescription: {
    fontSize: 16,
    marginBottom: 5,
  },
  journalMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  journalCategory: {
    color: '#4285f4',
    fontWeight: 'bold',
  },
  journalDate: {
    color: '#666',
  },
  hiddenButtons: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    height: '100%',
  },

  hiddenButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 75,
    height: '80%',
    borderRadius: 8,
  },
  editButton: {
    backgroundColor: '#fbbc05',
  },
  deleteButton: {
    backgroundColor: '#ea4335',
  },
  hiddenButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default HomeScreen;