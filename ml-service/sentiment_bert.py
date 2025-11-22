"""
BERT-based Sentiment Analysis Service for Vietnamese text
Uses PhoBERT or multilingual BERT for sentiment classification
"""
import os
import sys
from typing import Dict, List, Optional
import numpy as np

try:
    # Import without pipeline first to avoid torchvision dependency
    from transformers import AutoTokenizer, AutoModelForSequenceClassification
    import torch
    # Try to import pipeline separately
    try:
        from transformers import pipeline
    except ImportError:
        pipeline = None
        print("Warning: pipeline not available, will use direct model inference")
except ImportError:
    print("Installing transformers and torch...")
    os.system(f"{sys.executable} -m pip install transformers torch")
    from transformers import AutoTokenizer, AutoModelForSequenceClassification
    import torch
    try:
        from transformers import pipeline
    except ImportError:
        pipeline = None

# Model configuration
# Try Vietnamese sentiment model first, fallback to base model
MODEL_NAME = "vinai/phobert-base-v2"  # Vietnamese BERT model
# Alternative: "distilbert-base-multilingual-cased" (lighter, faster)

class BERTSentimentAnalyzer:
    def __init__(self, model_name: str = MODEL_NAME):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Loading BERT model: {model_name} on {self.device}")
        
        try:
            # Load tokenizer and base model
            self.tokenizer = AutoTokenizer.from_pretrained(model_name)
            # Try to load base model (AutoModel handles different architectures)
            try:
                from transformers import AutoModel
                self.model = AutoModel.from_pretrained(model_name)
                self.model.to(self.device)
                self.model.eval()
                print(f"Successfully loaded BERT model: {model_name}")
            except Exception as model_error:
                print(f"Could not load model {model_name}: {model_error}")
                # Try alternative: distilbert (lighter)
                try:
                    alt_model = "distilbert-base-multilingual-cased"
                    print(f"Trying alternative model: {alt_model}")
                    self.tokenizer = AutoTokenizer.from_pretrained(alt_model)
                    from transformers import AutoModel
                    self.model = AutoModel.from_pretrained(alt_model)
                    self.model.to(self.device)
                    self.model.eval()
                    print(f"Successfully loaded alternative model: {alt_model}")
                except Exception as alt_error:
                    print(f"Alternative model also failed: {alt_error}")
                    self.model = None
                    self.tokenizer = None
            
            # Create zero-shot pipeline as fallback (if available)
            if pipeline is not None:
                try:
                    self.zero_shot_pipeline = pipeline(
                        "zero-shot-classification",
                        model=model_name,
                        device=0 if self.device == "cuda" else -1
                    )
                except Exception as e:
                    print(f"Warning: Could not create pipeline: {e}")
                    self.zero_shot_pipeline = None
            else:
                self.zero_shot_pipeline = None
        except Exception as e:
            print(f"Error loading model: {e}")
            print("Falling back to rule-based sentiment...")
            self.model = None
            self.tokenizer = None
            self.zero_shot_pipeline = None
    
    def _predict_rating(self, text: str, sentiment_score: float) -> float:
        """
        Predict satisfaction rating (1-5) from text content and sentiment score
        
        Args:
            text: Input text
            sentiment_score: Sentiment score (0-1)
            
        Returns:
            Predicted rating (1-5)
        """
        text_lower = text.lower()
        
        # Keywords that indicate high satisfaction
        positive_keywords = [
            "rất hài lòng", "tuyệt vời", "xuất sắc", "tốt", "tốt lắm",
            "thích", "yêu thích", "cảm ơn", "đánh giá cao", "ưng ý"
        ]
        
        # Keywords that indicate low satisfaction
        negative_keywords = [
            "không hài lòng", "thất vọng", "tệ", "kém", "tồi tệ",
            "muốn nghỉ", "nghỉ việc", "bất công", "thiên vị", "không đủ"
        ]
        
        # Count positive/negative indicators
        positive_count = sum(1 for kw in positive_keywords if kw in text_lower)
        negative_count = sum(1 for kw in negative_keywords if kw in text_lower)
        
        # Base rating from sentiment score (1-5 scale)
        base_rating = 1 + (sentiment_score * 4)  # Map 0-1 to 1-5
        
        # Adjust based on keywords
        if positive_count > negative_count:
            base_rating += 0.5
        elif negative_count > positive_count:
            base_rating -= 0.5
        
        # Adjust based on sentiment score more precisely
        if sentiment_score >= 0.7:
            base_rating = max(4.0, base_rating)
        elif sentiment_score <= 0.3:
            base_rating = min(2.0, base_rating)
        
        # Clamp to 1-5 range
        predicted_rating = np.clip(base_rating, 1.0, 5.0)
        return round(predicted_rating, 1)
    
    def analyze(self, text: str, rating: Optional[float] = None) -> Dict:
        """
        Analyze sentiment of Vietnamese text using BERT
        Automatically predicts topic and rating if not provided
        
        Args:
            text: Input text to analyze
            rating: Optional rating (1-5) - if None, will be auto-predicted
            
        Returns:
            Dict with sentiment, sentiment_score, keywords, topic, predicted_rating
        """
        if not text or not text.strip():
            return {
                "sentiment": "Trung lập",
                "sentiment_score": 0.5,
                "keywords": [],
                "topic": "Khác",
                "topic_confidence": 0.5
            }
        
        # Clean text
        text = text.strip()
        
        # Use zero-shot classification if available
        if self.zero_shot_pipeline:
            try:
                candidate_labels = ["Tích cực", "Trung lập", "Tiêu cực"]
                result = self.zero_shot_pipeline(text, candidate_labels)
                
                # Get top label
                top_label = result["labels"][0]
                top_score = result["scores"][0]
                
                # Map to sentiment
                sentiment_map = {
                    "Tích cực": "Tích cực",
                    "Trung lập": "Trung lập",
                    "Tiêu cực": "Tiêu cực"
                }
                sentiment = sentiment_map.get(top_label, "Trung lập")
                
                # Adjust based on rating if provided
                if rating is not None:
                    rating_adjustment = (rating - 3) / 2  # -1 to 1
                    top_score = np.clip(top_score + rating_adjustment * 0.2, 0, 1)
                
                # Convert score to sentiment_score (0-1 scale)
                sentiment_score = float(top_score)
                
                # Apply negative keyword adjustment
                negative_adjustment = self._check_negative_keywords(text)
                sentiment_score = np.clip(sentiment_score + negative_adjustment, 0, 1)
                
                # Re-determine sentiment after adjustment
                if sentiment_score >= 0.6:
                    sentiment = "Tích cực"
                elif sentiment_score <= 0.4:
                    sentiment = "Tiêu cực"
                else:
                    sentiment = "Trung lập"
                
                # Extract keywords (simple: take important words)
                keywords = self._extract_keywords(text)
                topic_info = self.classify_topic(text)
                
                # Auto-predict rating if not provided
                predicted_rating = rating if rating is not None else self._predict_rating(text, sentiment_score)
                
                return {
                    "sentiment": sentiment,
                    "sentiment_score": round(sentiment_score, 2),
                    "keywords": keywords[:5],  # Top 5 keywords
                    "topic": topic_info["topic"],
                    "topic_confidence": topic_info["confidence"],
                    "predicted_rating": predicted_rating
                }
            except Exception as e:
                print(f"BERT pipeline error: {e}")
                return self._fallback_analysis(text, rating)
        elif self.model and self.tokenizer:
            # Use BERT embeddings for sentiment (simplified approach)
            try:
                # Tokenize and get embeddings
                inputs = self.tokenizer(text, return_tensors="pt", truncation=True, max_length=512, padding=True)
                inputs = {k: v.to(self.device) for k, v in inputs.items()}
                
                with torch.no_grad():
                    outputs = self.model(**inputs)
                    # Get [CLS] token embedding (first token)
                    embeddings = outputs.last_hidden_state[:, 0, :].cpu().numpy()[0]
                
                # Simple sentiment scoring based on embedding statistics
                # Positive sentiment tends to have higher mean activation
                mean_activation = float(np.mean(embeddings))
                std_activation = float(np.std(embeddings))
                
                # Normalize to 0-1 range (rough heuristic)
                sentiment_score = np.clip((mean_activation + 1) / 2, 0, 1)
                
                # Apply negative keyword adjustment
                negative_adjustment = self._check_negative_keywords(text)
                sentiment_score = np.clip(sentiment_score + negative_adjustment, 0, 1)
                
                # Adjust based on rating
                if rating is not None:
                    rating_adjustment = (rating - 3) / 2 * 0.3
                    sentiment_score = np.clip(sentiment_score + rating_adjustment, 0, 1)
                
                # Determine sentiment
                if sentiment_score >= 0.6:
                    sentiment = "Tích cực"
                elif sentiment_score <= 0.4:
                    sentiment = "Tiêu cực"
                else:
                    sentiment = "Trung lập"
                
                keywords = self._extract_keywords(text)
                topic_info = self.classify_topic(text)
                
                # Auto-predict rating if not provided
                predicted_rating = rating if rating is not None else self._predict_rating(text, sentiment_score)
                
                return {
                    "sentiment": sentiment,
                    "sentiment_score": round(sentiment_score, 2),
                    "keywords": keywords[:5],
                    "topic": topic_info["topic"],
                    "topic_confidence": topic_info["confidence"],
                    "predicted_rating": predicted_rating
                }
            except Exception as e:
                print(f"BERT embeddings error: {e}")
                return self._fallback_analysis(text, rating)
        else:
            # Fallback to rule-based
            return self._fallback_analysis(text, rating)
    
    def _extract_keywords(self, text: str) -> List[str]:
        """Extract keywords from text (simple implementation)"""
        # Remove common stop words
        stop_words = {"và", "của", "cho", "với", "là", "được", "trong", "từ", "về", "có", "không"}
        words = text.lower().split()
        keywords = [w for w in words if len(w) > 2 and w not in stop_words]
        # Return unique keywords
        return list(dict.fromkeys(keywords))[:10]
    
    def classify_topic(self, text: str) -> Dict[str, float]:
        """
        Classify topic of feedback using keyword matching and BERT embeddings
        
        Returns:
            Dict with topic name and confidence score
        """
        text_lower = text.lower()
        
        # Topic keywords mapping (mapped to model enum values)
        topic_keywords = {
            "Lương": [
                "lương", "thưởng", "tăng lương", "mức lương", "lương thấp", 
                "lương cao", "bonus", "tiền lương", "lương bổng", "lương quá"
            ],
            "Môi trường": [
                "môi trường", "đồng nghiệp", "văn phòng", "không gian", 
                "làm việc", "nơi làm việc", "văn hóa", "team", "phòng ban"
            ],
            "Quản lý": [
                "sếp", "quản lý", "trưởng phòng", "leader", "manager", 
                "giám đốc", "điều hành", "lãnh đạo", "thiên vị", "công bằng"
            ],
            "Phúc lợi": [
                "phúc lợi", "bảo hiểm", "nghỉ phép", "du lịch", "đào tạo", 
                "khám sức khỏe", "gym", "ăn trưa", "xe đưa đón"
            ],
            "Khen ngợi": [
                "tuyệt vời", "xuất sắc", "tốt", "cảm ơn", "đánh giá cao",
                "hài lòng", "thích", "yêu thích"
            ],
            "Khiếu nại": [
                "khiếu nại", "phàn nàn", "thất vọng", "không hài lòng",
                "bất công", "nghỉ việc", "muốn nghỉ"
            ],
            "Góp ý": [
                "góp ý", "đề xuất", "cải thiện", "tối ưu", "suggest"
            ]
        }
        
        # Count keyword matches for each topic
        topic_scores = {}
        for topic, keywords in topic_keywords.items():
            score = sum(1 for keyword in keywords if keyword in text_lower)
            topic_scores[topic] = score
        
        # If using BERT, enhance with embeddings
        if self.model and self.tokenizer:
            try:
                # Use zero-shot classification if available
                if self.zero_shot_pipeline:
                    candidate_labels = list(topic_keywords.keys())
                    try:
                        result = self.zero_shot_pipeline(text, candidate_labels)
                        # Merge with keyword scores
                        for i, label in enumerate(result["labels"]):
                            topic_scores[label] = topic_scores.get(label, 0) + result["scores"][i] * 2
                    except:
                        pass
            except:
                pass
        
        # Find top topic
        if not topic_scores or max(topic_scores.values()) == 0:
            return {"topic": "Khác", "confidence": 0.5}
        
        top_topic = max(topic_scores, key=topic_scores.get)
        max_score = topic_scores[top_topic]
        
        # Normalize confidence (0-1)
        total_score = sum(topic_scores.values())
        confidence = min(max_score / max(total_score, 1), 1.0)
        
        return {
            "topic": top_topic,
            "confidence": round(confidence, 2)
        }
    
    def _check_negative_keywords(self, text: str) -> float:
        """
        Check for negative keywords and phrases to adjust sentiment
        Returns adjustment factor (-1 to 0, where -1 is very negative)
        """
        text_lower = text.lower()
        
        # Strong negative indicators
        strong_negative = [
            "quá", "không có", "không hoạt động", "không tốt", "không đủ",
            "thường xuyên bị lỗi", "bị lỗi", "cũ", "khó", "rất nóng",
            "ồn ào", "không công bằng", "thiên vị", "bất công",
            "muốn nghỉ", "nghỉ việc", "thất vọng", "không hài lòng",
            "kém", "tồi tệ", "tệ", "xấu", "chậm", "bực"
        ]
        
        # Moderate negative indicators
        moderate_negative = [
            "vấn đề", "khó khăn", "thách thức", "cần cải thiện",
            "chưa tốt", "chưa đủ", "hạn chế", "thiếu"
        ]
        
        # Count negative indicators
        strong_count = sum(1 for phrase in strong_negative if phrase in text_lower)
        moderate_count = sum(1 for phrase in moderate_negative if phrase in text_lower)
        
        # Calculate adjustment (more negative = lower score)
        adjustment = -(strong_count * 0.3 + moderate_count * 0.15)
        return np.clip(adjustment, -1, 0)
    
    def _fallback_analysis(self, text: str, rating: Optional[float] = None) -> Dict:
        """Fallback to rule-based if BERT fails"""
        text_lower = text.lower()
        
        # Expanded positive words
        positive_words = [
            "tốt", "tuyệt", "hài lòng", "đẹp", "nhanh", "chuyên nghiệp",
            "xuất sắc", "tuyệt vời", "cảm ơn", "đánh giá cao", "thích",
            "yêu thích", "ưng ý", "tốt lắm", "rất tốt", "rất hài lòng"
        ]
        
        # Expanded negative words
        negative_words = [
            "xấu", "tệ", "chậm", "bực", "không hài lòng", "khiếu nại",
            "thất vọng", "kém", "tồi tệ", "không tốt", "không đủ",
            "quá", "ồn ào", "cũ", "bị lỗi", "khó", "nóng", "thiên vị",
            "bất công", "nghỉ việc", "muốn nghỉ"
        ]
        
        score = 0
        
        # Count positive words
        for word in positive_words:
            if word in text_lower:
                score += 1
        
        # Count negative words (weighted more heavily)
        for word in negative_words:
            if word in text_lower:
                score -= 1.5  # Negative words have more weight
        
        # Check for negative phrases
        negative_adjustment = self._check_negative_keywords(text)
        score += negative_adjustment * 5
        
        # Adjust based on rating if provided
        if rating:
            score += (rating - 3) * 0.5
        
        # Normalize score
        normalized = np.clip(score / 8, -1, 1)
        sentiment_score = (normalized + 1) / 2
        
        # Determine sentiment
        if sentiment_score >= 0.6:
            sentiment = "Tích cực"
        elif sentiment_score <= 0.4:
            sentiment = "Tiêu cực"
        else:
            sentiment = "Trung lập"
        
        topic_info = self.classify_topic(text)
        
        # Auto-predict rating if not provided
        predicted_rating = rating if rating is not None else self._predict_rating(text, sentiment_score)
        
        return {
            "sentiment": sentiment,
            "sentiment_score": round(sentiment_score, 2),
            "keywords": self._extract_keywords(text),
            "topic": topic_info["topic"],
            "topic_confidence": topic_info["confidence"],
            "predicted_rating": predicted_rating
        }


# Global analyzer instance
_analyzer = None

def get_analyzer():
    global _analyzer
    if _analyzer is None:
        _analyzer = BERTSentimentAnalyzer()
    return _analyzer

if __name__ == "__main__":
    # Test
    analyzer = get_analyzer()
    test_texts = [
        "Tôi rất hài lòng với dịch vụ này, nhân viên nhiệt tình và chuyên nghiệp.",
        "Dịch vụ chậm trễ, không hài lòng với cách xử lý.",
        "Ổn, không có gì đặc biệt."
    ]
    
    for text in test_texts:
        result = analyzer.analyze(text)
        print(f"Text: {text}")
        print(f"Sentiment: {result['sentiment']}, Score: {result['sentiment_score']}")
        print(f"Keywords: {result['keywords']}")
        print()

