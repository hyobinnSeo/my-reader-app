'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Upload, Type, BookOpen, Minus, Plus, ArrowLeft, ArrowRight } from "lucide-react"
import { Slider } from "@/components/ui/slider"

const PopupTranslationReader = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [inputMethod, setInputMethod] = useState(null);
    const [paragraphs, setParagraphs] = useState(null);
    const [translations, setTranslations] = useState({});
    const [fontSize, setFontSize] = useState(16);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showControls, setShowControls] = useState(true);
    const fileInputRef = useRef(null);
    const contentRef = useRef(null);
    const controlsTimeoutRef = useRef(null);
    const [directInput, setDirectInput] = useState('');
    const [lastScrollPosition, setLastScrollPosition] = useState(0);
    const [paginatedContent, setPaginatedContent] = useState([]);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);

    const handleBackToHome = () => {
        setParagraphs(null);
        setInputMethod(null);
        setDirectInput('');
        setCurrentPage(1);
        setCurrentPageIndex(0);
        setTranslations({});
    };

    const calculatePages = useCallback(() => {
        if (!contentRef.current || !paragraphs) return;

        const container = contentRef.current;
        const containerHeight = container.clientHeight;
        const pages = [];
        let currentPage = [];
        let currentHeight = 0;

        // Create a temporary div to measure content
        const measureDiv = document.createElement('div');
        measureDiv.style.fontSize = `${fontSize}px`;
        measureDiv.style.visibility = 'hidden';
        measureDiv.style.position = 'absolute';
        measureDiv.style.width = container.clientWidth + 'px';
        document.body.appendChild(measureDiv);

        for (const para of paragraphs) {
            const paraDiv = document.createElement('div');
            paraDiv.className = 'mb-6';
            para.sentences.forEach(sentence => {
                const sentenceSpan = document.createElement('span');
                sentenceSpan.textContent = sentence + ' ';
                paraDiv.appendChild(sentenceSpan);
            });

            measureDiv.appendChild(paraDiv);
            const paraHeight = paraDiv.offsetHeight;

            if (currentHeight + paraHeight > containerHeight) {
                pages.push(currentPage);
                currentPage = [para];
                currentHeight = paraHeight;
            } else {
                currentPage.push(para);
                currentHeight += paraHeight;
            }

            measureDiv.innerHTML = '';
        }

        if (currentPage.length > 0) {
            pages.push(currentPage);
        }

        document.body.removeChild(measureDiv);
        setPaginatedContent(pages);
        setTotalPages(pages.length);
    }, [paragraphs, fontSize]);

    useEffect(() => {
        calculatePages();
        window.addEventListener('resize', calculatePages);
        return () => window.removeEventListener('resize', calculatePages);
    }, [calculatePages]);

    // Add mouse movement handler to show/hide controls
    useEffect(() => {
        const handleMouseMove = () => {
            setShowControls(true);
            if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
            }
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
            }, 2000); // Hide after 2 seconds of inactivity
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
            }
        };
    }, []);

    const navigatePage = (direction) => {
        const newIndex = currentPageIndex + direction;
        if (newIndex >= 0 && newIndex < paginatedContent.length) {
            setCurrentPageIndex(newIndex);
            setCurrentPage(newIndex + 1);
        }
    };

    const splitIntoSentences = (text) => {
        const splits = text.split(/(?<=[.!?:]|\n)(?:\s+|\n|$)/);
        return splits
            .map(s => s.trim())
            .filter(s => s.length > 0);
    };

    const processParagraphs = (text) => {
        const paraArray = text.split(/\n\s*\n/);
        return paraArray.filter(para => para.trim()).map(para => ({
            text: para,
            sentences: splitIntoSentences(para)
        }));
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target.result;
                setParagraphs(processParagraphs(text));
            };
            reader.readAsText(file);
        }
    };

    const handleDirectInputSubmit = () => {
        if (directInput.trim()) {
            setParagraphs(processParagraphs(directInput));
        }
    };

    const showTranslation = useCallback((paraIndex, sentenceIndex, originalSentence) => {
        const key = `${paraIndex}-${sentenceIndex}`;
        setTranslations(prev => ({
            ...prev,
            [key]: { visible: true, original: originalSentence }
        }));
    }, []);

    const hideTranslation = useCallback((paraIndex, sentenceIndex, event) => {
        event.stopPropagation();
        const key = `${paraIndex}-${sentenceIndex}`;
        setTranslations(prev => ({
            ...prev,
            [key]: { visible: false }
        }));
    }, []);

    const renderQuotedText = (text) => {
        const parts = text.split(/"([^"]+)"/);
        return parts.map((part, index) => {
            if (index % 2 === 1) {
                return <span key={index} className={`${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>"{part}"</span>;
            }
            return <span key={index}>{part}</span>;
        });
    };

    const renderSentence = (sentence, paraIndex, sentenceIndex) => {
        const key = `${paraIndex}-${sentenceIndex}`;
        const translation = translations[key];

        return (
            <React.Fragment key={sentenceIndex}>
                <span
                    className={`cursor-pointer rounded px-1 transition-colors ${isDarkMode
                        ? 'hover:bg-gray-800'
                        : 'hover:bg-gray-100'
                        }`}
                    onClick={() => showTranslation(paraIndex, sentenceIndex, sentence)}
                >
                    {renderQuotedText(sentence.trim())}{' '}
                </span>

                {translation?.visible && (
                    <span
                        className={`block my-2 p-2 rounded-md shadow-sm cursor-pointer transition-colors ${isDarkMode
                            ? 'bg-gray-800 border border-gray-700 hover:bg-gray-700'
                            : 'bg-gray-100 border border-gray-200 hover:bg-gray-200'
                            }`}
                        onClick={(e) => hideTranslation(paraIndex, sentenceIndex, e)}
                    >
                        <span
                            className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                            translate="yes"
                        >
                            {translation.original}
                        </span>
                    </span>
                )}
            </React.Fragment>
        );
    };

    const renderControls = () => (
        <div className={`fixed bottom-0 left-0 right-0 p-4 transition-transform duration-300 ${showControls ? 'translate-y-0' : 'translate-y-full'}`}>
            <Card className={`mx-auto max-w-4xl ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <CardContent className="py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className={`flex items-center ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                                    <Type className="w-4 h-4 mr-2" />
                                    Font Size
                                </span>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setFontSize(prev => Math.max(12, prev - 1))}
                                        className={isDarkMode ? 'border-slate-600 hover:bg-slate-800 hover:border-slate-500 text-slate-200' : ''}
                                    >
                                        <Minus className="w-4 h-4" />
                                    </Button>
                                    <span className={`w-8 text-center ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>{fontSize}</span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setFontSize(prev => Math.min(24, prev + 1))}
                                        className={isDarkMode ? 'border-slate-600 hover:bg-slate-800 hover:border-slate-500 text-slate-200' : ''}
                                    >
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                            <Slider
                                value={[fontSize]}
                                min={12}
                                max={24}
                                step={1}
                                onValueChange={([value]) => setFontSize(value)}
                                className={isDarkMode ? 'dark' : ''}
                            />
                        </div>
                        <div className="flex items-center justify-between space-x-4">
                            <Button
                                variant="outline"
                                onClick={() => navigatePage(-1)}
                                disabled={currentPage === 1}
                                className={isDarkMode ? 'border-slate-600 hover:bg-slate-800 hover:border-slate-500 text-slate-200 disabled:bg-slate-900 disabled:text-slate-600' : ''}
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" /> Previous
                            </Button>
                            <div className={`flex items-center ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                                <BookOpen className="w-4 h-4 mr-2" />
                                {currentPage} / {totalPages}
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => navigatePage(1)}
                                disabled={currentPage === totalPages}
                                className={isDarkMode ? 'border-slate-600 hover:bg-slate-800 hover:border-slate-500 text-slate-200 disabled:bg-slate-900 disabled:text-slate-600' : ''}
                            >
                                Next <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    return (
        <div className={`min-h-screen flex flex-col ${isDarkMode ? 'bg-slate-950' : 'bg-white'}`}>
            <div className="flex justify-between p-4">
                {paragraphs && (
                    <Button
                        variant="outline"
                        onClick={handleBackToHome}
                        className={isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600' : ''}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
                    </Button>
                )}
                <Button
                    variant="outline"
                    onClick={() => setIsDarkMode(prev => !prev)}
                    className={isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600' : ''}
                >
                    {isDarkMode ? '🌞 Light Mode' : '🌙 Dark Mode'}
                </Button>
            </div>

            {!paragraphs && (
                <>
                    {!inputMethod && (
                        <Card className={`w-full max-w-xl mx-auto mt-8 ${isDarkMode ? 'bg-slate-900 border-slate-800' : ''}`} translate="no">
                            <CardContent className="pt-6">
                                <div className="space-y-4">
                                    <Button
                                        className={`w-full py-8 text-lg ${isDarkMode
                                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600'
                                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                                            }`}
                                        onClick={() => setInputMethod('file')}
                                    >
                                        <Upload className="mr-2" /> Upload Text File
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className={`w-full py-8 text-lg ${isDarkMode
                                            ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-600'
                                            : 'text-slate-900 border-slate-200 hover:bg-slate-100'
                                            }`}
                                        onClick={() => setInputMethod('direct')}
                                    >
                                        Input Text Directly
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    {inputMethod === 'file' && (
                        <Card className={`w-full max-w-xl mx-auto mt-8 ${isDarkMode ? 'bg-slate-900 border-slate-800' : ''}`} translate="no">
                            <CardContent className="pt-6">
                                <div className="space-y-4">
                                    <input
                                        type="file"
                                        accept=".txt"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                    <Button
                                        className={`w-full py-8 text-lg ${isDarkMode
                                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600'
                                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                                            }`}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Upload className="mr-2" /> Choose Text File
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className={`w-full ${isDarkMode
                                            ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-600'
                                            : 'text-slate-900 border-slate-200 hover:bg-slate-100'
                                            }`}
                                        onClick={() => setInputMethod(null)}
                                    >
                                        Back
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    {inputMethod === 'direct' && (
                        <Card className={`w-full max-w-xl mx-auto mt-8 ${isDarkMode ? 'bg-slate-900 border-slate-800' : ''}`} translate="no">
                            <CardContent className="pt-6">
                                <div className="space-y-4">
                                    <Textarea
                                        placeholder="Enter your text here..."
                                        value={directInput}
                                        onChange={(e) => setDirectInput(e.target.value)}
                                        className={`min-h-[200px] ${isDarkMode
                                            ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-400'
                                            : ''
                                            }`}
                                    />
                                    <div className="flex space-x-4">
                                        <Button
                                            className={`flex-1 ${isDarkMode
                                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600'
                                                : 'bg-slate-900 hover:bg-slate-800 text-white'
                                                }`}
                                            onClick={handleDirectInputSubmit}
                                            disabled={!directInput.trim()}
                                        >
                                            Process Text
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className={`flex-1 ${isDarkMode
                                                ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-600'
                                                : 'text-slate-900 border-slate-200 hover:bg-slate-100'
                                                }`}
                                            onClick={() => setInputMethod(null)}
                                        >
                                            Back
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}

            {paragraphs && (
                <div className="flex-1 flex flex-col" translate="no">
                    <div
                        ref={contentRef}
                        className={`flex-1 overflow-hidden px-4 ${isDarkMode ? 'bg-slate-950' : 'bg-white'}`}
                        style={{
                            fontSize: `${fontSize}px`
                        }}
                    >
                        <div className="max-w-4xl mx-auto h-full">
                            <div className={`rounded-lg p-6 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                {paginatedContent[currentPageIndex]?.map((para, paraIndex) => (
                                    <div key={paraIndex} className="mb-6">
                                        {para.sentences.map((sentence, sentenceIndex) =>
                                            renderSentence(sentence,
                                                paraIndex + (currentPageIndex * paginatedContent[currentPageIndex]?.length),
                                                sentenceIndex)
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    {renderControls()}
                </div>
            )}
        </div>
    );
};

export default PopupTranslationReader;