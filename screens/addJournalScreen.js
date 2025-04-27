import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
  Image,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useCameraPermissions,CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { executeDMLSql } from '../components/database/database';
import { Picker } from '@react-native-picker/picker';

const AddJournalScreen = ({ route,navigation }) => {
  const userId = route.params?.userId;
  console.log('User ID:', userId);
  const eeditingId = route.params?.editingId;
  const isEditMode = !!eeditingId;
  console.log('AddJournalScreen isEditMode:', isEditMode);
  // State management
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [camera, setCamera] = useState(null);
  const [image, setImage] = useState(null);
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [category, setCategory] = useState('All');
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Categories for filtering
  const categories = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks'];
// Request camera permissions
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  // Initialize camera 
  useEffect(() => {
    if (isEditMode) {
      console.log('Editing journal with ID:', eeditingId);
      setEditingId(eeditingId);
      setDescription(route.params?.description);
      setCategory(route.params?.category);
      setImage(route.params?.image);
    }

    initCamera();
  }, [isEditMode, cameraPermission]);

  const initCamera =  async () => {
    console.log('Initializing camera...');
      // const { status } = await Camera.requestCameraPermissionsAsync();
      if (!cameraPermission || cameraPermission.status !== 'granted') {
        console.log('Requesting camera permission...');
        try {
          await requestCameraPermission();
        } catch (error) {
          console.error('Error requesting camera permission:', error);
          Alert.alert('Error', 'Failed to request camera permission');
        }
      } else {
        console.log('Camera permission status:', cameraPermission.status);
      }
      setHasCameraPermission(cameraPermission?.status === 'granted');
    };


  // Take picture with camera
  const takePicture = async () => {
    if (!camera) return;
    
    try {
      const { uri } = await camera.takePictureAsync({
        quality: 0.8,
      });
      setImage(uri);
      setIsCameraOpen(false);
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take picture');
    }
  };

  // Select image from gallery
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow access to your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  // Save or update journal entry
  const saveJournal = async () => {
    if (!image || !description.trim()) {
      Alert.alert('Validation Error', 'Please add both an image and description');
      return;
    }

    try {
      if (!userId) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      if (editingId) {
        // Update existing entry
        await executeDMLSql(
          'UPDATE journals SET image = ?, description = ?, category = ? WHERE id = ?',
          [image, description.trim(), category, editingId]
        );
        console.log('Journal updated successfully');
        navigation.reset({
                  index: 0,
                  routes: [
                    { name: 'Home', params: { userId } },
                  ],
                })
      } else {
        // Create new entry
        await executeDMLSql(
          'INSERT INTO journals (userId, image, description, category, date) VALUES (?, ?, ?, ?, ?)',
          [
            userId,
            image,
            description.trim(),
            category,
            new Date().toISOString(),
          ]
        );
        console.log('Journal saved successfully')
        navigation.reset({
          index: 0,
          routes: [
            { name: 'Home', params: { userId } },
          ],
        })
      }
      
      resetForm();
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  // Reset form fields
  const resetForm = () => {
    setImage(null);
    setDescription('');
    setEditingId(null);
    setCategory('All');
  };


  // Camera permission denied
  if (hasCameraPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Text>Camera permission is required to take photos</Text>
        <Button
          title="Grant Permission"
          onPress={() => requestCameraPermission()}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      {/* Camera Modal */}
      <Modal visible={isCameraOpen} animationType="slide">
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            ref={(ref) => setCamera(ref)}
            ratio="16:9"
          />
          <View style={styles.cameraButtons}>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePicture}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
            <Button
              title="Close"
              onPress={() => setIsCameraOpen(false)}
              color="#ff4444"
            />
          </View>
        </View>
      </Modal>
        {/* Journal Input Section */}
        <View style={styles.inputContainer}>
          <Text style={styles.sectionTitle}>
            {editingId ? 'Edit Journal Entry' : 'Add New Journal Entry'}
          </Text>
          {/* Image Preview */}
          {image ? (
            <Image source={{ uri: image }} style={styles.previewImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text>No image selected</Text>
            </View>
          )}
          {/* Image Selection Buttons */}
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.imageButton}
              onPress={() => setIsCameraOpen(true)}
            >
              <Text style={styles.buttonText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.imageButton}
              onPress={pickImage}
            >
              <Text style={styles.buttonText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
          {/* Description Input */}
          <TextInput
            placeholder="What did you eat? Add details..."
            value={description}
            onChangeText={setDescription}
            style={styles.input}
            multiline
            numberOfLines={3}
          />
          {/* Category Picker */}
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Category:</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={category}
                onValueChange={(itemValue) => setCategory(itemValue)}
                style={styles.picker}
              >
                {categories.map((cat) => (
                  <Picker.Item key={cat} label={cat} value={cat} />
                ))}
              </Picker>
            </View>
          </View>
          {/* Save/Update Button */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={saveJournal}
          >
            <Text style={styles.saveButtonText}>
              {editingId ? 'Update Journal' : 'Save Journal'}
            </Text>
          </TouchableOpacity>
          {/* Cancel Edit Button (visible only when editing) */}
          {editingId && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={resetForm}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  cameraButtons: {
    position: 'absolute',
    bottom: 30,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 3,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  inputContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 15,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  imageButton: {
    backgroundColor: '#4285f4',
    padding: 10,
    borderRadius: 5,
    width: '48%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  pickerLabel: {
    marginRight: 10,
    fontSize: 16,
  },
  pickerWrapper: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
  },
  picker: {
    height: 50,
  },
  saveButton: {
    backgroundColor: '#34a853',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#ea4335',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  listContainer: {
    flex: 1,
    backgroundColor: 'white',
    padding: 15,
    margin: 15,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
    height: '100%',
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

export default AddJournalScreen;