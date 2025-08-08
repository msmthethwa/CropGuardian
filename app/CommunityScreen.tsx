import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
  Alert,
  Linking,
  Image,
  ActivityIndicator,
  Modal,
  Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../firebaseConfig';
import { collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "./navigationTypes";
import { RouteProp, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { uploadImageToImgBB } from '../utils/imgbb';

type Message = {
  id: string;
  text?: string;
  imageUri?: string;
  caption?: string;
  user: string;
  timestamp: Date;
  isMe: boolean;
  time: string;
  color: string;
  userId: string;
  replyTo?: {
    id: string;
    text?: string;
    imageUri?: string;
    caption?: string;
    user: string;
  };
  likes?: Record<string, boolean>;
  dislikes?: Record<string, boolean>;
};

export default function CommunityScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'CommunityScreen'>>();
  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [userName, setUserName] = useState<string>('');
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [profileImages, setProfileImages] = useState<Record<string, string>>({});
  const [imageLoadErrorUserIds, setImageLoadErrorUserIds] = useState<Record<string, boolean>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editText, setEditText] = useState('');
  const [showMessageActions, setShowMessageActions] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [caption, setCaption] = useState('');
  const [showCaptionModal, setShowCaptionModal] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState('');
  const [editingCaption, setEditingCaption] = useState(false);
  const [editCaptionText, setEditCaptionText] = useState('');
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewMessage, setPreviewMessage] = useState<Message | null>(null);
  const [expandedCaptions, setExpandedCaptions] = useState<Record<string, boolean>>({});
  const [expandedMessages, setExpandedMessages] = useState<Record<string, boolean>>({});

  const toggleMessageExpansion = (messageId: string) => {
    setExpandedMessages(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };
  const flatListRef = React.useRef<FlatList>(null);
const MAX_CAPTION_LENGTH = 100;
const MAX_MESSAGE_LENGTH = 100;

  useEffect(() => {
    if (route.params?.userName) {
      setUserName(route.params.userName);
    } else {
      const user = auth.currentUser;
      setUserName(user?.displayName || user?.email?.split('@')[0] || 'Anonymous');
    }
  }, [route.params]);

  useEffect(() => {
    const messagesRef = collection(db, 'messages');
    const q = query(messagesRef, orderBy('timestamp'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const user = data.user || 'Anonymous';
        const userId = data.userId || '';
        const isMe = user === userName;

        newMessages.push({
          id: doc.id,
          text: data.text,
          imageUri: data.imageUri,
          caption: data.caption,
          user,
          timestamp: data.timestamp?.toDate(),
          isMe,
          time: data.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          color: isMe ? '#46a200' : '#4B5563',
          userId,
          replyTo: data.replyTo,
          likes: data.likes || {},
          dislikes: data.dislikes || {}
        });
      });
      setMessages(newMessages);
    });

    return () => unsubscribe();
  }, [userName]);

  useEffect(() => {
    const fetchProfileImages = async () => {
      const uniqueUserIds = Array.from(new Set(messages.map(msg => msg.userId)));
      const newProfileImages: Record<string, string> = {};
      
      for (const userId of uniqueUserIds) {
        if (userId && !profileImages[userId]) {
          try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists() && userDoc.data().profileImageUrl) {
              newProfileImages[userId] = userDoc.data().profileImageUrl;
            }
          } catch (error) {
            console.error('Error fetching profile picture:', error);
          }
        }
      }
      
      if (Object.keys(newProfileImages).length > 0) {
        setProfileImages(prev => ({ ...prev, ...newProfileImages }));
      }
    };

    if (messages.length > 0) {
      fetchProfileImages();
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToIndex({ index: messages.length - 1, animated: true });
    }
  }, [messages]);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'We need access to your photos to upload images');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImageUri(result.assets[0].uri);
      setShowCaptionModal(true);
    }
  };

  const handleImageWithCaption = async () => {
    if (selectedImageUri) {
      setShowCaptionModal(false);
      await uploadImageAndSaveMessage(selectedImageUri);
      setCaption('');
    }
  };

  const uploadImageAndSaveMessage = async (uri: string) => {
    if (!auth.currentUser) {
      Alert.alert('Error', 'You must be logged in to send images');
      return;
    }

    setIsUploading(true);
    try {
      const user = auth.currentUser;
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      const imageUrl = await uploadImageToImgBB(base64, '1srTbq');

      const replyData = replyingTo ? {
        replyTo: {
          id: replyingTo.id,
          user: replyingTo.user,
          ...(replyingTo.text && { text: replyingTo.text }),
          ...(replyingTo.imageUri && { imageUri: replyingTo.imageUri })
        }
      } : {};

      await addDoc(collection(db, 'messages'), {
        imageUri: imageUrl,
        caption: caption.trim(),
        user: userName,
        userId: user.uid,
        timestamp: new Date(),
        ...replyData,
        likes: {},
        dislikes: {}
      });
      setReplyingTo(null);
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to send image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const sendMessage = async () => {
    if (message.trim()) {
      try {
        const user = auth.currentUser;
        if (!user) {
          Alert.alert("Error", "You must be logged in to send messages");
          return;
        }
        
        const replyData = replyingTo ? {
          replyTo: {
            id: replyingTo.id,
            user: replyingTo.user,
            ...(replyingTo.text && { text: replyingTo.text }),
            ...(replyingTo.imageUri && { imageUri: replyingTo.imageUri })
          }
        } : {};

        await addDoc(collection(db, 'messages'), {
          text: message,
          user: userName,
          userId: user.uid,
          timestamp: new Date(),
          ...replyData,
          likes: {},
          dislikes: {}
        });
        setMessage('');
        setReplyingTo(null);
      } catch (error) {
        console.error("Error sending message: ", error);
        Alert.alert("Error", "Failed to send message. Please try again.");
      }
    }
  };

  const handleMessageLongPress = (message: Message) => {
    if (message.userId === auth.currentUser?.uid) {
      setSelectedMessage(message);
      setShowMessageActions(true);
    }
  };

  const handleEditMessage = () => {
    if (selectedMessage) {
      if (selectedMessage.imageUri) {
        setEditingCaption(true);
        setEditCaptionText(selectedMessage.caption || '');
      } else {
        setEditingMessage(selectedMessage);
        setEditText(selectedMessage.text || '');
      }
      setShowMessageActions(false);
    }
  };

  const toggleCaptionExpansion = (messageId: string) => {
    setExpandedCaptions(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  const updateCaption = async () => {
    if (selectedMessage && editCaptionText.trim()) {
      try {
        await updateDoc(doc(db, 'messages', selectedMessage.id), {
          caption: editCaptionText
        });
        setEditingCaption(false);
        setEditCaptionText('');
        setSelectedMessage(null);
      } catch (error) {
        console.error("Error updating caption: ", error);
        Alert.alert("Error", "Failed to update caption");
      }
    }
  };

  const handleDeleteMessage = async () => {
    if (selectedMessage) {
      try {
        await deleteDoc(doc(db, 'messages', selectedMessage.id));
        setShowMessageActions(false);
      } catch (error) {
        console.error("Error deleting message: ", error);
        Alert.alert("Error", "Failed to delete message");
      }
    }
  };

  const updateMessage = async () => {
    if (editingMessage && editText.trim()) {
      try {
        await updateDoc(doc(db, 'messages', editingMessage.id), {
          text: editText
        });
        setEditingMessage(null);
        setEditText('');
      } catch (error) {
        console.error("Error updating message: ", error);
        Alert.alert("Error", "Failed to update message");
      }
    }
  };

  const handleReaction = async (messageId: string, reaction: 'like' | 'dislike') => {
    const user = auth.currentUser;
    if (!user) return;

    const messageRef = doc(db, 'messages', messageId);
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    const currentLikes = message.likes || {};
    const currentDislikes = message.dislikes || {};
    const userId = user.uid;

    let updates = {};
    
    if (reaction === 'like') {
      if (currentLikes[userId]) {
        updates = {
          [`likes.${userId}`]: null
        };
      } else {
        updates = {
          [`likes.${userId}`]: true,
          [`dislikes.${userId}`]: null
        };
      }
    } else {
      if (currentDislikes[userId]) {
        updates = {
          [`dislikes.${userId}`]: null
        };
      } else {
        updates = {
          [`dislikes.${userId}`]: true,
          [`likes.${userId}`]: null
        };
      }
    }

    try {
      await updateDoc(messageRef, updates);
    } catch (error) {
      console.error("Error updating reaction: ", error);
    }
  };

  const scrollToMessage = (messageId: string) => {
    const index = messages.findIndex(msg => msg.id === messageId);
    if (index !== -1) {
      flatListRef.current?.scrollToIndex({ index, animated: true });
    }
  };

  const handleReplyPress = (messageId: string) => {
    const originalMessage = messages.find(msg => msg.id === messageId);
    if (originalMessage) {
      scrollToMessage(messageId);
    }
  };

  const renderReplyPreview = (replyTo: Message['replyTo'], isMe: boolean) => {
    if (!replyTo) return null;
    
    return (
      <TouchableOpacity 
        onPress={() => handleReplyPress(replyTo.id)}
        style={[
          styles.replyContainer,
          isMe ? styles.myReplyContainer : styles.otherReplyContainer
        ]}
      >
        <View style={styles.replyIndicator} />
        <View style={styles.replyContent}>
          <Text style={[
            styles.replyUsername,
            isMe && { color: 'rgba(255,255,255,0.7)' }
          ]}>
            {replyTo.user}
          </Text>
          {replyTo.text ? (
            <Text 
              style={[
                styles.replyText,
                isMe && { color: 'rgba(255,255,255,0.7)' }
              ]}
              numberOfLines={1}
            >
              {replyTo.text}
            </Text>
          ) : (
            <Text 
              style={[
                styles.replyText,
                isMe && { color: 'rgba(255,255,255,0.7)' }
              ]}
            >
              {replyTo.caption || 'Image'}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderReactions = (message: Message) => {
    const likesCount = message.likes ? Object.keys(message.likes).filter(k => message.likes?.[k]).length : 0;
    const dislikesCount = message.dislikes ? Object.keys(message.dislikes).filter(k => message.dislikes?.[k]).length : 0;
    const userId = auth.currentUser?.uid;
    const isLiked = userId && message.likes?.[userId];
    const isDisliked = userId && message.dislikes?.[userId];

    return (
      <View style={styles.reactionsContainer}>
        <TouchableOpacity 
          onPress={() => handleReaction(message.id, 'like')}
          style={[styles.reactionButton, isLiked && styles.reactionActive]}
        >
          <Ionicons name="thumbs-up" size={16} color={isLiked ? '#46a200' : '#6B7280'} />
          {likesCount > 0 && <Text style={styles.reactionCount}>{likesCount}</Text>}
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => handleReaction(message.id, 'dislike')}
          style={[styles.reactionButton, isDisliked && styles.reactionActive]}
        >
          <Ionicons name="thumbs-down" size={16} color={isDisliked ? '#EF4444' : '#6B7280'} />
          {dislikesCount > 0 && <Text style={styles.reactionCount}>{dislikesCount}</Text>}
        </TouchableOpacity>
      </View>
    );
  };

  const renderItem = ({ item }: { item: Message }) => (
    <TouchableOpacity 
      onLongPress={() => handleMessageLongPress(item)}
      onPress={() => setReplyingTo(item)}
      activeOpacity={0.8}
    >
      <View style={[
        styles.messageRow,
        item.isMe ? styles.myMessageRow : styles.otherMessageRow
      ]}>
        {!item.isMe && (
        <View style={styles.avatar}>
          {profileImages[item.userId] && !imageLoadErrorUserIds[item.userId] ? (
            <Image 
              source={{ uri: profileImages[item.userId] }} 
              style={styles.profileImage} 
              onError={() => {
                setImageLoadErrorUserIds(prev => ({ ...prev, [item.userId]: true }));
              }}
            />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: item.color }]}>
              <Text style={styles.avatarFallbackText}>
                {item.user.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        )}
        
        <View style={[
          styles.messageBubble,
          item.isMe ? styles.myMessageBubble : styles.otherMessageBubble
        ]}>
          {renderReplyPreview(item.replyTo, item.isMe)}
          <View style={styles.messageHeader}>
            <Text style={[styles.userName, item.isMe && { color: 'white' }]}>
              {item.user}
            </Text>
            <Text style={[styles.time, item.isMe && { color: 'white' }]}>
              {item.time}
            </Text>
          </View>
          {item.text && (
            <>
              <Text style={[styles.messageText, item.isMe && { color: 'white' }]}>
                {expandedMessages[item.id]
                  ? item.text
                  : item.text.length > MAX_MESSAGE_LENGTH
                    ? `${item.text.substring(0, MAX_MESSAGE_LENGTH)}... `
                    : item.text}
              </Text>
              {item.text.length > MAX_MESSAGE_LENGTH && (
                <TouchableOpacity onPress={() => toggleMessageExpansion(item.id)}>
                  <Text style={[styles.readMoreText, expandedMessages[item.id] ? styles.readLessColor : styles.readMoreColor]}>
                    {expandedMessages[item.id] ? 'Read less' : 'Read more'}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
          {item.imageUri && (
            <>
              <TouchableOpacity 
                onPress={() => {
                  setPreviewMessage(item);
                  setShowImagePreview(true);
                }}
              >
                <Image 
                  source={{ uri: item.imageUri }} 
                  style={styles.messageImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
              {item.caption && (
                <View>
                  <Text style={[styles.messageCaption, item.isMe && styles.myMessageCaption]}>
                    {expandedCaptions[item.id] 
                      ? item.caption
                      : item.caption.length > MAX_CAPTION_LENGTH
                        ? `${item.caption.substring(0, MAX_CAPTION_LENGTH)}... `
                        : item.caption}
                  </Text>
                  {item.caption.length > MAX_CAPTION_LENGTH && (
                    <TouchableOpacity onPress={() => toggleCaptionExpansion(item.id)}>
                      <Text style={[styles.readMoreText, expandedCaptions[item.id] ? styles.readLessColor : styles.readMoreColor]}>
                        {expandedCaptions[item.id] ? 'Read less' : 'Read more'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </>
          )}
          {renderReactions(item)}
        </View>

        {item.isMe && (
          <View style={styles.avatar}>
            {profileImages[item.userId] && !imageLoadErrorUserIds[item.userId] ? (
              <Image 
                source={{ uri: profileImages[item.userId] }} 
                style={styles.profileImage} 
                onError={() => {
                  setImageLoadErrorUserIds(prev => ({ ...prev, [item.userId]: true }));
                }}
              />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: '#46a200' }]}>
                <Text style={styles.avatarFallbackText}>
                  {item.user.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <LinearGradient
          colors={['#46a200', '#39D2C0']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.navigate("HomeScreen", { userName })}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Community Chat</Text>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => setIsMenuVisible(!isMenuVisible)}
          >
            <Ionicons name="ellipsis-vertical" size={24} color="white" />
          </TouchableOpacity>
        </LinearGradient>

        {isMenuVisible && (
          <TouchableOpacity
            style={styles.menuOverlay}
            activeOpacity={1}
            onPress={() => setIsMenuVisible(false)}
          >
            <View style={styles.menuContainer}>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => navigation.navigate('CommunityGuidelinesScreen')}
              >
                <Text style={styles.menuItemText}>Community Guidelines</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => {
                  setIsMuted(!isMuted);
                  Alert.alert(
                    'Notifications',
                    `Notifications ${!isMuted ? 'muted' : 'unmuted'}`
                  );
                }}
              >
                <Text style={styles.menuItemText}>
                  {isMuted ? 'Unmute Notifications' : 'Mute Notifications'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={async () => {
                  try {
                    await auth.signOut();
                    navigation.navigate('LoginScreen');
                  } catch (error) {
                    console.error('Error logging out: ', error);
                  }
                }}
              >
                <Text style={[styles.menuItemText, styles.logoutText]}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chatContainer}
          onScrollToIndexFailed={({ index }) => {
            flatListRef.current?.scrollToOffset({ offset: index * 100, animated: true });
          }}
        />

        {replyingTo && (
          <View style={styles.replyPreview}>
            <View style={styles.replyPreviewContent}>
              <Text style={styles.replyPreviewUsername}>
                Replying to {replyingTo.user}
              </Text>
              <Text style={styles.replyPreviewText} numberOfLines={1}>
                {replyingTo.text || replyingTo.caption || 'Image'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setReplyingTo(null)} style={styles.cancelReplyButton}>
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        )}

        {editingMessage && (
          <View style={styles.editContainer}>
            <TextInput
              style={styles.editInput}
              value={editText}
              onChangeText={setEditText}
              autoFocus
            />
            <View style={styles.editButtons}>
              <TouchableOpacity 
                style={styles.cancelEditButton}
                onPress={() => {
                  setEditingMessage(null);
                  setEditText('');
                }}
              >
                <Text style={styles.cancelEditText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.updateButton}
                onPress={updateMessage}
              >
                <Text style={styles.updateButtonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {editingCaption && (
          <View style={styles.editContainer}>
            <TextInput
              style={styles.editInput}
              value={editCaptionText}
              onChangeText={setEditCaptionText}
              placeholder="Edit caption..."
              autoFocus
            />
            <View style={styles.editButtons}>
              <TouchableOpacity 
                style={styles.cancelEditButton}
                onPress={() => {
                  setEditingCaption(false);
                  setEditCaptionText('');
                }}
              >
                <Text style={styles.cancelEditText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.updateButton}
                onPress={updateCaption}
              >
                <Text style={styles.updateButtonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TouchableOpacity 
            style={styles.attachmentButton}
            onPress={pickImage}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="#46a200" />
            ) : (
              <Ionicons name="image" size={24} color="#46a200" />
            )}
          </TouchableOpacity>
          <TextInput
            style={[styles.input, { textAlignVertical: 'top' }]}
            placeholder="Type your message..."
            placeholderTextColor="#6B7280"
            value={message}
            onChangeText={setMessage}
            multiline
            scrollEnabled={true}
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={showCaptionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCaptionModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowCaptionModal(false)}
        >
          <View style={styles.captionModalContainer}>
            <View style={styles.captionModalContent}>
              <Text style={styles.captionModalTitle}>Add a Caption (Optional)</Text>
              <TextInput
                style={styles.captionInput}
                placeholder="Enter caption..."
                placeholderTextColor="#999"
                value={caption}
                onChangeText={setCaption}
                multiline
                maxLength={150}
              />
              <View style={styles.captionButtons}>
                <TouchableOpacity 
                  style={[styles.captionButton, styles.cancelCaptionButton]}
                  onPress={() => {
                    setShowCaptionModal(false);
                    setCaption('');
                  }}
                >
                  <Text style={styles.cancelCaptionButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.captionButton, styles.submitCaptionButton]}
                  onPress={handleImageWithCaption}
                >
                  <Text style={styles.submitCaptionButtonText}>Send</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={showMessageActions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMessageActions(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowMessageActions(false)}
        >
          <View style={styles.messageActionsContainer}>
            <TouchableOpacity 
              style={styles.messageAction}
              onPress={handleEditMessage}
            >
              <Ionicons name="create-outline" size={20} color="#46a200" />
              <Text style={styles.messageActionText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.messageAction}
              onPress={handleDeleteMessage}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
              <Text style={styles.messageActionText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={showImagePreview}
        transparent={true}
        onRequestClose={() => setShowImagePreview(false)}
      >
        <View style={styles.imagePreviewContainer}>
          <TouchableOpacity 
            style={styles.closePreviewButton}
            onPress={() => setShowImagePreview(false)}
          >
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>
          {previewMessage?.imageUri && (
            <Image 
              source={{ uri: previewMessage.imageUri }}
              style={styles.fullSizeImage}
              resizeMode="contain"
            />
          )}
          {previewMessage?.caption && (
            <View style={styles.previewCaptionContainer}>
              <Text style={styles.previewCaptionText}>
                {expandedCaptions[previewMessage.id] 
                  ? previewMessage.caption
                  : previewMessage.caption.length > MAX_CAPTION_LENGTH
                    ? `${previewMessage.caption.substring(0, MAX_CAPTION_LENGTH)}... `
                    : previewMessage.caption}
              </Text>
              {previewMessage.caption.length > MAX_CAPTION_LENGTH && (
                <TouchableOpacity onPress={() => toggleCaptionExpansion(previewMessage.id)}>
                  <Text style={styles.previewReadMoreText}>
                    {expandedCaptions[previewMessage.id] ? 'Read less' : 'Read more'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 48 : 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'Raleway-SemiBold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  menuButton: {
    padding: 8,
  },
  chatContainer: {
    paddingVertical: 12,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 12,
    marginVertical: 6,
  },
  myMessageRow: {
    justifyContent: 'flex-end',
  },
  otherMessageRow: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallbackText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 12,
    padding: 16,
    margin: 8,
  },
  myMessageBubble: {
    backgroundColor: '#46a200',
    marginLeft: 8,
  },
  otherMessageBubble: {
    backgroundColor: 'white',
    marginRight: 8,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  userName: {
    fontWeight: '600',
    fontSize: 14,
    color: '#1F2937',
    fontFamily: 'Roboto',
  },
  time: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Roboto',
  },
  messageText: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Roboto',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginTop: 8,
  },
  messageCaption: {
    fontSize: 14,
    color: '#374151',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  myMessageCaption: {
    color: 'white',
  },
  replyContainer: {
    borderLeftWidth: 3,
    paddingLeft: 8,
    marginBottom: 8,
  },
  myReplyContainer: {
    borderLeftColor: 'rgba(255,255,255,0.5)',
  },
  otherReplyContainer: {
    borderLeftColor: 'rgba(0,0,0,0.2)',
  },
  replyIndicator: {
    position: 'absolute',
    left: -3,
    top: 0,
    bottom: 0,
    width: 3,
  },
  replyContent: {
    flex: 1,
  },
  replyUsername: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.6)',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  replyText: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.6)',
  },
  replyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  replyPreviewContent: {
    flex: 1,
    marginRight: 8,
  },
  replyPreviewUsername: {
    fontSize: 12,
    color: '#46a200',
    fontWeight: 'bold',
  },
  replyPreviewText: {
    fontSize: 12,
    color: '#6B7280',
  },
  cancelReplyButton: {
    padding: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  attachmentButton: {
    padding: 8,
    marginRight: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    fontFamily: 'Roboto',
    maxHeight: 100,
  },
  sendButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#46a200',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  menuContainer: {
    position: 'absolute',
    top: 50,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 200,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontSize: 16,
    color: '#1F2937',
    fontFamily: 'Roboto',
  },
  logoutText: {
    color: '#EF4444',
  },
  reactionsContainer: {
    flexDirection: 'row',
    marginTop: 8,
    alignItems: 'center',
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  reactionActive: {
    backgroundColor: '#E5E7EB',
  },
  reactionCount: {
    marginLeft: 4,
    fontSize: 12,
    color: '#6B7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captionModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: '100%',
  },
  captionModalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
  },
  captionModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  captionInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    marginBottom: 15,
    textAlignVertical: 'top',
  },
  captionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  captionButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  cancelCaptionButton: {
    backgroundColor: '#f0f0f0',
  },
  submitCaptionButton: {
    backgroundColor: '#46a200',
  },
  cancelCaptionButtonText: {
    color: '#333',
  },
  submitCaptionButtonText: {
    color: 'white',
  },
  messageActionsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 8,
    width: 200,
  },
  messageAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  messageActionText: {
    marginLeft: 12,
    fontSize: 16,
  },
  editContainer: {
    padding: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  editInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 8,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelEditButton: {
    padding: 8,
    marginRight: 12,
  },
  cancelEditText: {
    color: '#6B7280',
  },
  updateButton: {
    backgroundColor: '#46a200',
    borderRadius: 12,
    padding: 8,
    paddingHorizontal: 16,
  },
  updateButtonText: {
    color: 'white',
  },
  imagePreviewContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullSizeImage: {
    width: '100%',
    height: '100%',
  },
  closePreviewButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 5,
  },
  previewCaptionContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 8,
  },
  previewCaptionText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
  readMoreText: {
    color: '#46a200',
    fontSize: 12,
    marginTop: 4,
    fontWeight: 'bold',
  },
  readMoreColor: {
    color: '#2563EB',
  },
  readLessColor: {
    color: '#6B7280',
  },
  previewReadMoreText: {
    color: '#46a200',
    fontSize: 14,
    marginTop: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});