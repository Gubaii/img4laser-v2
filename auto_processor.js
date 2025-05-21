// 自动图像处理器 JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // DOM元素
    const imageUpload = document.getElementById('image-upload');
    const originalPreview = document.getElementById('original-preview');
    const processedPreview = document.getElementById('processed-preview');
    const analyzeBtn = document.getElementById('analyze-btn');
    const downloadBtn = document.getElementById('download-btn');
    const manualEditBtn = document.getElementById('manual-edit-btn');
    const materialTypeSelect = document.getElementById('material-type');
    const materialColorSelect = document.getElementById('material-color');
    const laserTypeSelect = document.getElementById('laser-type');
    const histogramCanvas = document.getElementById('histogram-canvas');
    
    // 新增 - Gamma调整相关DOM元素
    const gammaSlider = document.getElementById('gamma-slider');
    const gammaValueDisplay = document.getElementById('gamma-value-display');
    const resetGammaBtn = document.getElementById('reset-gamma-btn');
    
    // 图像分析结果元素
    const imageTypeResult = document.getElementById('image-type-result');
    const avgBrightness = document.getElementById('avg-brightness');
    const contrastValue = document.getElementById('contrast-value');
    const darkRatio = document.getElementById('dark-ratio');
    const brightRatio = document.getElementById('bright-ratio');
    const edgeComplexity = document.getElementById('edge-complexity');
    const detailRichness = document.getElementById('detail-richness');
    const smoothness = document.getElementById('smoothness');
    const recommendedDepth = document.getElementById('recommended-depth');
    
    // 参数显示元素
    const paramContrast = document.getElementById('param-contrast');
    const paramGamma = document.getElementById('param-gamma');
    const paramClahe = document.getElementById('param-clahe');
    const paramClarity = document.getElementById('param-clarity');
    const paramBrightness = document.getElementById('param-brightness');
    const paramUsm = document.getElementById('param-usm');
    
    // 全局变量
    let originalImage = null;
    let processedImageData = null;
    let originalImageData = null;
    let imageStats = null;
    let detectedImageType = null;
    let optimizedParams = null;
    let recommendedGamma = 1.0; // 新增 - 保存推荐的Gamma值
    
    // 常量
    const IMAGE_TYPES = {
        PHOTO: 'photo',
        CARTOON: 'cartoon',
        PORTRAIT: 'portrait',
        TEXT: 'text'
    };
    
    // 事件监听
    imageUpload.addEventListener('change', handleImageUpload);
    analyzeBtn.addEventListener('click', analyzeAndOptimize);
    downloadBtn.addEventListener('click', downloadProcessedImage);
    // 移除已删除按钮的事件监听
    // manualEditBtn.addEventListener('click', redirectToManualEdit);
    materialTypeSelect.addEventListener('change', updateOptimization);
    materialColorSelect.addEventListener('change', updateOptimization);
    laserTypeSelect.addEventListener('change', updateOptimization);
    
    // 新增 - Gamma调整相关事件监听
    gammaSlider.addEventListener('input', updateGammaValue);
    resetGammaBtn.addEventListener('click', resetGamma);
    
    // 创建加载指示器元素
    function createLoadingIndicator() {
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.innerHTML = `
            <div class="spinner"></div>
            <div class="loading-text">处理中...</div>
        `;
        return loadingIndicator;
    }
    
    // 显示加载状态
    function showLoading(container) {
        // 移除可能存在的旧加载指示器
        const oldIndicator = document.querySelector('.loading-indicator');
        if (oldIndicator) {
            oldIndicator.remove();
        }
        
        const loadingIndicator = createLoadingIndicator();
        container.appendChild(loadingIndicator);
        return loadingIndicator;
    }
    
    // 隐藏加载状态
    function hideLoading() {
        const loadingIndicator = document.querySelector('.loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.remove();
        }
    }
    
    // 新增 - 更新Gamma值并应用到图像
    function updateGammaValue() {
        const gammaValue = parseFloat(gammaSlider.value);
        gammaValueDisplay.textContent = gammaValue.toFixed(2);
        
        // 应用新的Gamma值到图像
        if (originalImageData && optimizedParams) {
            // 显示加载指示器
            const loadingIndicator = showLoading(processedPreview);
            
            // 使用setTimeout让UI有时间更新
            setTimeout(() => {
                try {
                    // 复制优化参数，但更新Gamma值
                    const updatedParams = Object.assign({}, optimizedParams);
                    updatedParams.gamma = gammaValue;
                    
                    // 重新处理图像
                    processedImageData = processImage(originalImageData, updatedParams);
                    displayProcessedImage();
                    
                    // 更新显示的参数值
                    paramGamma.textContent = gammaValue.toFixed(2);
                } catch (error) {
                    console.error('Gamma值调整失败:', error);
                } finally {
                    // 隐藏加载指示器
                    hideLoading();
                }
            }, 50);
        }
    }
    
    // 新增 - 重置Gamma到推荐值
    function resetGamma() {
        gammaSlider.value = recommendedGamma;
        gammaValueDisplay.textContent = recommendedGamma.toFixed(2);
        
        // 应用推荐的Gamma值到图像
        if (originalImageData && optimizedParams) {
            // 显示加载指示器
            const loadingIndicator = showLoading(processedPreview);
            
            // 使用setTimeout让UI有时间更新
            setTimeout(() => {
                try {
                    // 复制优化参数，但重置Gamma值
                    const updatedParams = Object.assign({}, optimizedParams);
                    updatedParams.gamma = recommendedGamma;
                    
                    // 重新处理图像
                    processedImageData = processImage(originalImageData, updatedParams);
                    displayProcessedImage();
                    
                    // 更新显示的参数值
                    paramGamma.textContent = recommendedGamma.toFixed(2);
                } catch (error) {
                    console.error('重置Gamma值失败:', error);
                } finally {
                    // 隐藏加载指示器
                    hideLoading();
                }
            }, 50);
        }
    }
    
    // 处理图像上传
    function handleImageUpload(event) {
        if (event.target.files && event.target.files[0]) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                // 创建图像元素
                originalImage = new Image();
                originalImage.onload = function() {
                    // 显示原始图像
                    displayOriginalImage();
                    // 启用分析按钮
                    analyzeBtn.disabled = false;
                    
                    // 禁用Gamma调整控件直到图像被分析
                    gammaSlider.disabled = true;
                    resetGammaBtn.disabled = true;
                };
                originalImage.src = e.target.result;
            };
            
            reader.readAsDataURL(event.target.files[0]);
        }
    }
    
    // 显示原始图像
    function displayOriginalImage() {
        // 创建画布显示原始图像
        const canvas = document.createElement('canvas');
        
        // --- START ADDED SCALING LOGIC ---
        let newWidth = originalImage.width;
        let newHeight = originalImage.height;
        const MAX_DIMENSION = 2048;

        if (Math.max(originalImage.width, originalImage.height) > MAX_DIMENSION) {
            const scaleFactor = MAX_DIMENSION / Math.max(originalImage.width, originalImage.height);
            newWidth = Math.round(originalImage.width * scaleFactor);
            newHeight = Math.round(originalImage.height * scaleFactor);
        }
        // --- END ADDED SCALING LOGIC ---

        canvas.width = newWidth; // Use newWidth
        canvas.height = newHeight; // Use newHeight
        const ctx = canvas.getContext('2d');
        ctx.drawImage(originalImage, 0, 0, newWidth, newHeight); // Draw with new dimensions
        
        // 保存原始图像数据
        originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // 添加到预览区域
        originalPreview.innerHTML = '';
        originalPreview.appendChild(canvas);
    }
    
    // 分析并优化图像
    function analyzeAndOptimize() {
        if (!originalImage) return;
        
        // 禁用分析按钮，防止重复点击
        analyzeBtn.disabled = true;
        
        // 显示加载状态
        imageTypeResult.textContent = "分析中...";
        
        // 显示加载指示器
        const loadingIndicator = showLoading(processedPreview);
        
        // 使用 setTimeout 让 UI 能够更新
        setTimeout(() => {
            try {
                // 1. 分析图像
                imageStats = analyzeImage(originalImageData);
                
                // 2. 确定图像类型
                detectedImageType = determineImageType(imageStats);
                
                // 3. 根据图像类型和材质选择优化参数
                optimizedParams = getOptimizedParams(detectedImageType, materialTypeSelect.value, laserTypeSelect.value);
                
                // 保存推荐的Gamma值
                recommendedGamma = optimizedParams.gamma;
                
                // 4. 应用参数进行图像处理
                processedImageData = processImage(originalImageData, optimizedParams);
                
                // 5. 显示处理后的图像
                displayProcessedImage();
                
                // 6. 更新分析结果显示
                updateAnalysisDisplay();
                
                // 7. 绘制直方图
                drawHistogram(histogramCanvas, originalImageData, processedImageData);
                
                // 8. 启用下载按钮
                downloadBtn.disabled = false;
                
                // 9. 更新并启用Gamma调整控件
                gammaSlider.value = recommendedGamma;
                gammaValueDisplay.textContent = recommendedGamma.toFixed(2);
                gammaSlider.disabled = false;
                resetGammaBtn.disabled = false;
            } catch (error) {
                console.error('图像处理失败:', error);
                imageTypeResult.textContent = "处理失败，请重试";
            } finally {
                // 隐藏加载指示器
                hideLoading();
                
                // 重新启用分析按钮
                analyzeBtn.disabled = false;
            }
        }, 100);
    }
    

    
    // 分析图像获取统计数据
    function analyzeImage(imageData) {
        const { data, width, height } = imageData;
        const stats = {
            histogram: new Array(256).fill(0),
            brightness: 0,
            contrast: 0,
            darkPixels: 0,
            brightPixels: 0,
            edgePixels: 0,
            smoothRegions: 0,
            detailRegions: 0
        };
        
        // 步骤1: 转换为灰度图
        const grayImageData = new ImageData(
            new Uint8ClampedArray(imageData.data),
            imageData.width,
            imageData.height
        );
        convertToGrayscale(grayImageData);
        
        // 步骤2: 计算亮度直方图
        for (let i = 0; i < data.length; i += 4) {
            // 转换为灰度
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const brightness = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
            
            // 更新直方图
            stats.histogram[brightness]++;
            
            // 统计暗像素和亮像素
            if (brightness < 64) stats.darkPixels++;
            if (brightness > 192) stats.brightPixels++;
        }
        
        // 步骤3: 像素总数
        const totalPixels = width * height;
        
        // 步骤4: 计算平均亮度
        let totalBrightness = 0;
        for (let i = 0; i < 256; i++) {
            totalBrightness += i * stats.histogram[i];
        }
        stats.brightness = totalBrightness / totalPixels;
        
        // 步骤5: 计算对比度 (标准差方法)
        let varianceSum = 0;
        for (let i = 0; i < 256; i++) {
            varianceSum += Math.pow(i - stats.brightness, 2) * stats.histogram[i];
        }
        stats.contrast = Math.sqrt(varianceSum / totalPixels);
        
        // 步骤6: 计算暗区和亮区比例
        stats.darkRatio = stats.darkPixels / totalPixels;
        stats.brightRatio = stats.brightPixels / totalPixels;
        
        // 步骤7: 使用高级分析函数提取更多特征
        // 7.1 直方图特征分析 - 基于img4laser
        const histFeatures = analyzeHistogramFeatures(stats.histogram);
        stats.peaks = histFeatures.peakCount;
        stats.peakPositions = histFeatures.peaks.map(p => p.position);
        stats.bwRatio = histFeatures.bwRatio;
        stats.valleyDepth = histFeatures.valleyDepth;
        
        // 7.2 边缘特征分析 - 基于img4laser
        const edgeFeatures = analyzeEdgeFeatures(grayImageData);
        stats.edgeRatio = edgeFeatures.edgeRatio;
        stats.distinctEdgeRatio = edgeFeatures.distinctEdgeRatio;
        stats.longEdgeRatio = edgeFeatures.longEdgeRatio;
        stats.edgeContrast = edgeFeatures.edgeContrast;
        
        // 7.3 纹理特征分析 - 基于img4laser
        const textureFeatures = analyzeTextureFeatures(grayImageData);
        stats.colorSimplicity = textureFeatures.colorSimplicity;
        stats.lowVarianceAreaRatio = textureFeatures.lowVarianceAreaRatio;
        stats.skinToneRatio = textureFeatures.skinToneRatio;
        stats.colorBlockCount = textureFeatures.colorBlockCount;
        
        // 7.4 计算平滑度 (基于局部方差)
        const smoothnessData = calculateSmoothness(imageData);
        stats.smoothness = smoothnessData.smoothness;
        stats.detailRichness = 1 - smoothnessData.smoothness;
        
        console.log("图像分析完成，特征:", stats);
        return stats;
    }
    
    // 确定图像类型 - 基于img4laser项目算法
    function determineImageType(stats) {
        console.log('开始图像类型判断...');
        console.log(`特征数据: 对比度=${stats.contrast.toFixed(1)}, 低方差比例=${stats.lowVarianceAreaRatio.toFixed(3)}, 黑白比例=${stats.bwRatio.toFixed(3)}, 峰值数=${stats.peaks}`);
        
        // 1. 强卡通/线稿判断 (基于黑白占比和峰值数量)
        if ((stats.peaks <= 3 || stats.peaks === 0) && stats.bwRatio > 0.8) {
            console.log('判定为卡通 (峰值<=3或0 且 黑白占比 > 0.8)');
            return IMAGE_TYPES.CARTOON;
        }

        // 2. 强卡通判断 (基于极高平滑度)
        if (stats.lowVarianceAreaRatio > 0.95 || 
            (stats.lowVarianceAreaRatio > 0.92 && stats.bwRatio > 0.001)) {
             console.log(`判定为卡通 (低方差占比 ${stats.lowVarianceAreaRatio.toFixed(3)})`);
             return IMAGE_TYPES.CARTOON;
        }

        // 3. 高黑白对比判断
        if (stats.bwRatio > 0.7) {
            // 非常高的黑白占比，直接判定为卡通
            console.log(`判定为卡通 (极高黑白对比 ${stats.bwRatio.toFixed(3)})`);
            return IMAGE_TYPES.CARTOON;
        } else if (stats.bwRatio > 0.5 && stats.lowVarianceAreaRatio > 0.7) {
            // 中等黑白占比，配合中等平滑度
            console.log(`判定为卡通 (黑白占比 ${stats.bwRatio.toFixed(3)} 且 平滑度 ${stats.lowVarianceAreaRatio.toFixed(3)})`);
            return IMAGE_TYPES.CARTOON;
        }

        // 4. 几何形状特征判断
        const hasGeometricFeatures = stats.longEdgeRatio > 0.15 && // A. 长直边较多
                                   stats.colorBlockCount < 10 &&  // B. 色块数量较少
                                   stats.colorSimplicity > 0.7;   // C. 颜色简单

        if (hasGeometricFeatures && stats.lowVarianceAreaRatio > 0.8) {
            console.log('判定为卡通 (检测到明显的几何形状特征)');
            return IMAGE_TYPES.CARTOON;
        }

        // 5. 高色彩一致性判断
        const hasHighColorConsistency = stats.colorSimplicity > 0.85 && // 颜色单一性非常高
                                      stats.lowVarianceAreaRatio > 0.75 && // 较高的平滑区域
                                      stats.peaks <= 4; // 颜色数量有限

        if (hasHighColorConsistency) {
            console.log('判定为卡通 (检测到高度的色彩一致性)');
            return IMAGE_TYPES.CARTOON;
        }

        // 6. 中间情况判断 (检查平滑度、边缘、峰值数量) - 从imageProcessor同步
        const sharpEdges = stats.distinctEdgeRatio > 0.04 && stats.edgeContrast > 50; 
        const highEnoughLowVariance = stats.lowVarianceAreaRatio > 0.85 && stats.bwRatio > 0.01;

        if (highEnoughLowVariance && sharpEdges) {
             if (stats.peaks === 1 && stats.stdDev < 50) { 
                 console.log('疑似卡通，但直方图特征更像照片，继续检测...');
             } else if (stats.peaks > 5) { 
                 console.log('疑似卡通，但峰值过多 (>5)，继续检测...');
             } else if (stats.skinToneRatio > 0.3) {
                 console.log('疑似卡通，但检测到较多肤色区域，继续检测...');
             } else {
                 console.log(`判定为卡通 (中等优先级：低方差>0.85 且 边缘锐利 且 峰值<=5 且 肤色比例<=0.3)`); 
                 return IMAGE_TYPES.CARTOON;
             }
        }
        
        // 7. 人像照片判断 - 基于肤色检测
        if (stats.skinToneRatio > 0.15 && stats.contrast < 70) {
            console.log(`判定为人像 (肤色比例 ${stats.skinToneRatio.toFixed(3)})`);
            return IMAGE_TYPES.PORTRAIT;
        }
        
        // 8. 默认为普通照片
        console.log('判定为普通照片 (不满足所有特殊条件)');
        return IMAGE_TYPES.PHOTO;
    }
    
    // 获取优化参数
    function getOptimizedParams(imageType, materialType, laserType) {
        // 解析材料类型，可能是复合值，例如 "light-wood"
        const materials = {
            "wood": "wood",
            "metal": "metal",
            "plastic": "plastic",
            "vinyl": "vinyl",
            "paper": "paper",
            "silicone": "silicone", 
            "rubber": "rubber",
            "leather": "leather",
            "stone": "stone",
            "screen-printing": "screen-printing",
            "other": "other"
        };
        
        // 提取基础材料类型
        const baseMaterial = materials[materialType] || "wood";
        
        // 木材材质的基本参数
        const baseParams = {
            contrast: 100,         // 常规对比度 (限制在90-110)
            gamma: 1.0,            // 伽马校正 (0.6-3.0)
            claheClipLimit: 3.0,   // 三次差值局部均衡clip_limit (2-5)
            claheTileSize: 128,     // 三次差值局部均衡tile_size (从64改为128)
            clarity: 25,           // 清晰度 (0-30)
            brightness: {          // 全局亮度
                highlights: 0,     // 高光 (-100-100)
                shadows: 0,        // 阴影 (-100-100)
                whites: 0,         // 白色 (-100-100)
                blacks: 0          // 黑色 (-100-100)
            },
            usm: {                 // USM锐化
                amount: 60,        // 数量 (50-100) -> will be scaled to 0.5-1.0 for applyUSM
                radius: 8,         // 半径 (3-15)
                threshold: 5       // 阈值 (0-50)
            },
            invert: false          // 是否反色
        };
        
        // 保持TEXT类型也被视为卡通类型处理，兼容之前的判断逻辑
        const isCartoon = (imageType === IMAGE_TYPES.CARTOON || imageType === IMAGE_TYPES.TEXT);
        
        if (isCartoon) {
            baseParams.contrast = 120;         // INCREASED base contrast from 105 to 120
            baseParams.gamma = 1.2;            // 将伽马值从1.4降低到1.2
            baseParams.claheClipLimit = 2.8;   // INCREASED from 2.5 to 2.8 (enhance local contrast)
            baseParams.clarity = 28;           // 从70降低到28
            baseParams.brightness.shadows = 10; 
            baseParams.brightness.whites = 0;   // 保持白色区域不变
            baseParams.brightness.highlights = 0; // 去掉高光调整，对比度调整已足够
            baseParams.usm.amount = 65;        // INCREASED from 60 to 65
            baseParams.usm.radius = 4;         
            baseParams.usm.threshold = 8;      
        } else { // Non-cartoon (photo/portrait)
            baseParams.contrast = 95;          
            baseParams.gamma = 1.6;             // 将伽马值从1.8降低到1.6
            baseParams.claheClipLimit = 3.8;   
            baseParams.clarity = 25;           // 从60降低到25
            baseParams.brightness.shadows = 30;  // 从5增加到30，极大提亮阴影区域
            baseParams.brightness.highlights = -15; // DECREASED from -25 to -15 (less darkening of highlights)
            baseParams.brightness.whites = 0;   // REMOVED white adjustment (was +20) to preserve white backgrounds
            baseParams.brightness.blacks = +3;  // DECREASED from +5 to +3 (less darkening of blacks)
            baseParams.usm.amount = 75;        
            baseParams.usm.radius = 10;        
            baseParams.usm.threshold = 5;      
        }
        
        // 检查是否为深色材料，如果是，设置反色标志
        const materialColor = materialColorSelect.value;
        if (materialColor === 'dark') {
            baseParams.invert = true;
        }

        // 根据材料类型调整参数
        switch (baseMaterial) {
            case 'wood':
                // 木材参数调整
                // 降低木材材质的伽马值
                baseParams.gamma = isCartoon ? 1.0 : 1.5; // 分别从1.5和2.0降低到1.0和1.5
                break;
                
            case 'metal':
                // 金属需要高对比度和清晰锐利的边缘
                baseParams.contrast = Math.min(120, baseParams.contrast + 15);
                baseParams.clarity = Math.min(30, baseParams.clarity + 5);
                baseParams.usm.amount = Math.min(100, baseParams.usm.amount + 15);
                baseParams.usm.threshold = Math.max(3, baseParams.usm.threshold - 2);
                // 大幅降低金属材质的伽马值
                baseParams.gamma = isCartoon ? 0.8 : 1.4; // 分别从1.3和1.9降低到0.8和1.4
                break;
                
            case 'plastic':
                // 塑料需要中等对比度，较少的锐化以避免噪点
                baseParams.contrast = Math.min(105, baseParams.contrast + 5);
                baseParams.clarity = Math.max(15, baseParams.clarity - 5);
                baseParams.usm.threshold += 3; // 增加阈值以减少锐化噪点
                // 塑料适合较低的gamma以保持平滑过渡，但降低0.2
                baseParams.gamma = isCartoon ? 1.0 : 1.5; // 分别从1.2和1.7降低到1.0和1.5
                break;
                
            case 'vinyl':
                // 乙烯基类似塑料但需要更好的边缘定义
                baseParams.contrast = Math.min(110, baseParams.contrast + 7);
                baseParams.clarity = Math.min(30, baseParams.clarity + 3);
                baseParams.usm.radius = Math.min(12, baseParams.usm.radius + 2);
                baseParams.gamma = isCartoon ? 0.7 : 1.1; // 分别从0.9和1.3降低到0.7和1.1
                break;
                
            case 'paper':
                // 纸张需要柔和处理，避免过度锐化
                baseParams.contrast = Math.max(90, baseParams.contrast - 5);
                baseParams.usm.amount = Math.max(50, baseParams.usm.amount - 10);
                baseParams.usm.threshold += 5;
                baseParams.clarity = Math.max(15, baseParams.clarity - 5);
                // 纸张适合低gamma以保持细节
                baseParams.gamma = isCartoon ? 0.65 : 1.0; // 分别从0.85和1.2降低到0.65和1.0
                break;
                
            case 'silicone':
                // 硅胶需要柔和的处理
                baseParams.contrast = Math.max(90, baseParams.contrast - 10);
                baseParams.clarity = Math.max(10, baseParams.clarity - 5);
                baseParams.usm.amount = Math.max(50, baseParams.usm.amount - 15);
                baseParams.usm.threshold += 8;
                baseParams.gamma = isCartoon ? 0.6 : 1.0; // 分别从0.8和1.2降低到0.6和1.0
                break;
                
            case 'rubber':
                // 橡胶需要增强质感
                baseParams.contrast = Math.min(115, baseParams.contrast + 10);
                baseParams.clarity = Math.min(30, baseParams.clarity + 3);
                baseParams.brightness.shadows += 15; // 从10增加到15
                baseParams.usm.threshold += 3;
                baseParams.gamma = isCartoon ? 0.7 : 1.2; // 分别从0.9和1.4降低到0.7和1.2
                break;
                
            case 'leather':
                // 皮革需要增强纹理细节
                baseParams.contrast = Math.min(110, baseParams.contrast + 8);
                baseParams.clarity = Math.min(30, baseParams.clarity + 5);
                baseParams.usm.amount = Math.min(90, baseParams.usm.amount + 5);
                baseParams.usm.radius = Math.min(9, baseParams.usm.radius + 1);
                baseParams.gamma = isCartoon ? 0.75 : 1.3; // 分别从0.95和1.5降低到0.75和1.3
                break;
                
            case 'stone':
                // 石材需要高对比度和纹理增强
                baseParams.contrast = Math.min(120, baseParams.contrast + 15);
                baseParams.clarity = Math.min(30, baseParams.clarity + 5);
                baseParams.usm.amount = Math.min(95, baseParams.usm.amount + 10);
                baseParams.gamma = isCartoon ? 0.8 : 1.4; // 分别从1.0和1.6降低到0.8和1.4
                break;
                
            case 'screen-printing':
                // 丝网印刷需要极高对比度和锐利边缘
                baseParams.contrast = Math.min(130, baseParams.contrast + 25);
                baseParams.clarity = Math.min(30, baseParams.clarity + 5);
                baseParams.usm.amount = Math.min(100, baseParams.usm.amount + 20);
                baseParams.usm.threshold = Math.max(2, baseParams.usm.threshold - 3);
                baseParams.gamma = isCartoon ? 0.9 : 1.5; // 分别从1.1和1.7降低到0.9和1.5
                break;
                
            case 'other':
                // 其他材料复用木材的基本参数，不做特殊调整
                break;
        }
        
        // 根据激光器类型调整参数
        switch (laserType) {
            case 'co2':
                // 二氧化碳激光器适合深雕，对比度和清晰度较高
                baseParams.contrast = Math.min(115, baseParams.contrast + 8); // 增加对比度
                baseParams.clarity = Math.min(30, baseParams.clarity + 5); // 增加清晰度
                baseParams.usm.amount = Math.min(100, baseParams.usm.amount + 5); // 增加锐化强度
                // 对于照片类型，增强黑白层次
                if (!isCartoon) {
                    baseParams.brightness.blacks -= 5; // 使黑色更深
                    // 移除对白色区域的调整，保持原始白色
                }
                break;
                
            case 'blue':
                // 蓝光激光器适合精细雕刻，需要更精确的边缘和细节
                baseParams.contrast = Math.max(95, baseParams.contrast - 3); // 略微降低对比度以保留更多细节
                baseParams.clarity = Math.min(30, baseParams.clarity + 5); // 增加清晰度
                baseParams.usm.radius = Math.max(4, Math.min(9, baseParams.usm.radius - 2)); // 降低锐化半径以增强边缘锐度
                baseParams.usm.threshold = Math.max(1, baseParams.usm.threshold - 3); // 降低锐化阈值增强小细节
                // 大幅度提升蓝光激光的阴影处理
                baseParams.brightness.shadows += 20; // 从15增加到20，更强提亮阴影
                baseParams.claheClipLimit = Math.min(6, baseParams.claheClipLimit + 0.8); // 增强局部对比度
                break;
                
            case 'red':
                // 红光激光器功率较低，需要更高对比度和锐度以确保清晰雕刻
                baseParams.contrast = Math.min(125, baseParams.contrast + 15); // 显著增加对比度
                baseParams.clarity = Math.min(30, baseParams.clarity + 5); // 增加清晰度
                baseParams.gamma = Math.min(2.0, baseParams.gamma + 0.2); // 将伽马调整值从0.2降低至0，不再额外增加伽马值
                baseParams.usm.amount = Math.min(100, baseParams.usm.amount + 15); // 显著增加锐化强度
                baseParams.usm.threshold = Math.max(2, baseParams.usm.threshold - 2); // 降低锐化阈值
                // 增强黑白对比
                baseParams.brightness.blacks -= 8; // 使黑色区域更深
                // 降低白色调整，避免过度灰化白色区域
                baseParams.brightness.whites += 5; // 轻微调整白色区域以增强对比，但不过度
                // 大幅增加阴影提亮效果
                baseParams.brightness.shadows += 10; // 为红光激光器额外提升阴影区域
                break;
        }
        
        // 融合图像特征进行最终参数微调
        if (imageStats) {
            // 根据图像对比度调整
            if (imageStats.contrast < 40) {
                baseParams.contrast = Math.min(110, baseParams.contrast + 5); // 低对比度增强
                baseParams.claheClipLimit = Math.min(5, baseParams.claheClipLimit + 0.5);
            } else if (imageStats.contrast > 100) {
                baseParams.contrast = Math.max(90, baseParams.contrast - 5); // 高对比度降低
            }

            // 检测暗区比例较大的照片，提高阴影区域亮度
            if (!isCartoon && imageStats.darkRatio > 0.25) {  // 降低触发阈值从0.3到0.25
                // 暗区占比超过25%，显著增加阴影亮度
                const shadowBoost = Math.min(45, 20 + imageStats.darkRatio * 50);  // 增加基础提升(10→20)和系数(30→50)，最大值从25增加到45
                baseParams.brightness.shadows = Math.max(baseParams.brightness.shadows, shadowBoost);
                console.log(`检测到暗区比例较大(${(imageStats.darkRatio * 100).toFixed(1)}%)，显著增加阴影亮度至 ${baseParams.brightness.shadows}`);
                
                // 如果是特定材质如橡胶，进一步增加阴影提升
                if (baseMaterial === 'rubber') {
                    baseParams.brightness.shadows += 10;
                    console.log(`橡胶材质，额外增加阴影提升10，最终值: ${baseParams.brightness.shadows}`);
                }
            }

            // Gamma adjustment based on image brightness, AFTER type, material, and power adjustments.
            if (!isCartoon) { // For Photos
                const brightness = imageStats.brightness;
                const minPhotoGamma = 1.0; // 提高照片的最小伽马值，从0.8增加到1.0
                const maxPhotoGamma = 2.5; // 增加最大伽马值，从2.0增加到2.5
                
                // 保存当前已调整的伽马值（通过类型、材质和激光器调整后的）
                const currentPhotoGamma = baseParams.gamma;
                
                // 打印调试信息
                console.log(`照片分析 - 亮区占比: ${(imageStats.brightRatio * 100).toFixed(1)}%, 暗区占比: ${(imageStats.darkRatio * 100).toFixed(1)}%`);
                
                // 根据暗区占比调整伽马值
                if (imageStats.darkRatio > 0.4) {
                    // 暗区大：降低伽马值（使图像更亮），但不要太低
                    let newGamma;
                    
                    if (imageStats.darkRatio > 0.8) {
                        // 极暗照片（暗区>80%）：直接设置为较低伽马值，但不要太低
                        newGamma = 1.0; // 从0.8调整到1.0
                        console.log(`极暗照片 (暗区占比 ${(imageStats.darkRatio * 100).toFixed(1)}%) - 直接设置伽马值为1.0`);
                    } else {
                        // 根据暗区占比计算降低伽马的程度，但减少调整幅度
                        const reductionFactor = Math.min(0.4, (imageStats.darkRatio - 0.4) * 1.0); // 从0.6降低到0.4
                        newGamma = Math.max(minPhotoGamma, currentPhotoGamma - reductionFactor);
                        console.log(`暗区照片 (${(imageStats.darkRatio * 100).toFixed(1)}%) - 降低伽马值: ${currentPhotoGamma} -> ${newGamma.toFixed(2)}, 减少: ${reductionFactor.toFixed(2)}`);
                    }
                    
                    baseParams.gamma = newGamma;
                } 
                // 亮度较正常或偏亮的照片处理
                else if (brightness < 100) { // Dark image, needs lower gamma (to brighten within the new range)
                    // Interpolate downwards from current baseParams.gamma towards minPhotoGamma
                    const darkFactor = Math.max(0, (100 - brightness) / 100.0) * 0.7; // 减少调整系数
                    baseParams.gamma = baseParams.gamma - darkFactor * (baseParams.gamma - minPhotoGamma);
                } else if (brightness > 160) { // Bright image, needs higher gamma (to darken towards new max)
                    // Interpolate upwards from current baseParams.gamma towards maxPhotoGamma
                    const brightFactor = Math.min(1, Math.max(0, (brightness - 160) / (255.0 - 160.0)));
                    baseParams.gamma = baseParams.gamma + brightFactor * (maxPhotoGamma - baseParams.gamma);
                }
                
                // 高亮区占比大的照片，可能需要增加伽马值
                if (imageStats.brightRatio > 0.5 && imageStats.darkRatio < 0.3) {
                    // 亮区占比大且暗区占比小：通过增加伽马值来加深中间调和高光
                    const brightAdjustment = Math.min(0.7, (imageStats.brightRatio - 0.5) * 1.5); // 增加调整系数
                    const newGamma = Math.min(maxPhotoGamma, baseParams.gamma + brightAdjustment);
                    console.log(`高亮照片 (亮区占比 ${(imageStats.brightRatio * 100).toFixed(1)}%) - 增加伽马值: ${baseParams.gamma} -> ${newGamma.toFixed(2)}, 增加: ${brightAdjustment.toFixed(2)}`);
                    baseParams.gamma = newGamma;
                }

                // Final clamp for photos
                baseParams.gamma = Math.max(minPhotoGamma, Math.min(maxPhotoGamma, baseParams.gamma));

            } else { // For Cartoon images - ENHANCE WHITES PRESERVATION
                // Adjust contrast based on brightness and existing contrast
                if (imageStats.brightness < 80) {
                    // Darker cartoons need more contrast
                    baseParams.contrast = Math.min(140, baseParams.contrast + 20);
                } else if (imageStats.brightness > 180) {
                    // Very bright cartoons might need less contrast to avoid blowing out details
                    baseParams.contrast = Math.max(105, baseParams.contrast - 5);
                    // For bright cartoons, increase whites darkening to preserve details
                    baseParams.brightness.whites = Math.min(30, baseParams.brightness.whites + 5);
                }
                
                // Further adjust contrast based on the image's own contrast level
                if (imageStats.contrast < 40) {
                    // Low contrast images need more enhancement
                    baseParams.contrast = Math.min(140, baseParams.contrast + 15);
                } else if (imageStats.contrast > 100) {
                    // Already high contrast images need less enhancement
                    baseParams.contrast = Math.max(105, baseParams.contrast - 10);
                }
                
                // Adjust whites based on bright pixel ratio
                if (imageStats.brightRatio > 0.3) {
                    if (isCartoon) {
                        // 卡通图像：增加伽马值以加深中间调，而不是调整白色区域
                        baseParams.gamma = Math.min(2.0, baseParams.gamma + 0.2);
                    } else {
                        // 照片类型，对于高亮区域比例高的图像，适度增加白色抑制
                        baseParams.brightness.whites = Math.min(35, baseParams.brightness.whites + 10);
                    }
                }
                
                // Ensure contrast stays within desired range
                baseParams.contrast = Math.max(105, Math.min(140, baseParams.contrast));
                
                // 根据亮区暗区占比动态调整卡通图像的伽马值
                const currentCartoonGamma = baseParams.gamma;
                
                // 打印调试信息
                console.log(`卡通图像分析 - 亮区占比: ${(imageStats.brightRatio * 100).toFixed(1)}%, 暗区占比: ${(imageStats.darkRatio * 100).toFixed(1)}%`);
                
                if (imageStats.darkRatio > 0.4) {
                    // 暗区大：降低伽马值（使图像更亮）
                    let newGamma;
                    
                    if (imageStats.darkRatio > 0.85) {
                        // 极暗图像（暗区>85%）：设置较低伽马值但不要太低
                        newGamma = 0.8; // 调整原值0.6为0.8，避免过度增亮
                        console.log(`极暗卡通图像 (暗区占比 ${(imageStats.darkRatio * 100).toFixed(1)}%) - 直接设置伽马值为0.8`);
                    } else {
                        // 常规暗图像：当前伽马值减去较小的调整量
                        newGamma = Math.max(0.9, currentCartoonGamma - 0.5); // 从0.8调整到0.9，减少调整幅度
                        console.log(`暗区占比大 (${(imageStats.darkRatio * 100).toFixed(1)}%) - 降低伽马值: ${currentCartoonGamma} -> ${newGamma.toFixed(2)}`);
                    }
                    
                    baseParams.gamma = newGamma;
                } else if (imageStats.brightRatio > 0.3) {
                    // 亮区大：根据亮区占比程度增加伽马值（使中间调更深）
                    let adjustment;
                    
                    if (imageStats.brightRatio > 0.7) {
                        // 特别高亮区（>70%）：更激进地增加伽马值
                        adjustment = 1.2 + (imageStats.brightRatio - 0.7) * 2.5; // 增加调整幅度
                    } else if (imageStats.brightRatio > 0.5) {
                        // 较高亮区（50-70%）：中等增加伽马值
                        adjustment = 0.9 + (imageStats.brightRatio - 0.5) * 1.5; // 从0.7增加到0.9
                    } else {
                        // 普通亮区（30-50%）：轻微增加伽马值
                        adjustment = 0.8 * imageStats.brightRatio; // 从0.6增加到0.8
                    }
                    
                    const newGamma = Math.min(3.0, currentCartoonGamma + adjustment); // 最大值从2.8增加到3.0
                    console.log(`亮区占比大 (${(imageStats.brightRatio * 100).toFixed(1)}%) - 增加伽马值: ${currentCartoonGamma} -> ${newGamma.toFixed(2)}，调整量: +${adjustment.toFixed(2)}`);
                    baseParams.gamma = newGamma;
                }

                // 限制最小伽马值不低于1.0，除非是极暗图像
                if (imageStats.darkRatio <= 0.7 && baseParams.gamma < 1.0) {
                    baseParams.gamma = 1.0;
                    console.log(`调整后的伽马值过低，重置为默认最小值1.0`);
                }
            }
        }
        
        return baseParams;
    }
    
    // 处理图像
    function processImage(imageData, params) {
        // 打印处理参数，便于调试
        console.log("处理图像参数:", JSON.stringify({
            contrast: params.contrast,
            gamma: params.gamma,
            claheClipLimit: params.claheClipLimit,
            claheTileSize: params.claheTileSize,
            clarity: params.clarity
        }));
        
        // 创建图像数据副本
        const processedData = new ImageData(
            new Uint8ClampedArray(imageData.data),
            imageData.width,
            imageData.height
        );
        
        // 调用从 script.js 复制过来的函数，使用它们在 script.js 中的原始名称和参数签名
        // 注意：顺序修改为与script.js中的applyAdjustments函数一致
        
        // 1. 应用常规对比度
        // script.js function: applyNormalContrast(data, level)
        applyNormalContrast(processedData.data, params.contrast);
        
        // 2. 应用伽马校正
        // script.js function: applyGammaCorrection(data, gamma)
        console.log('Applying Gamma with value:', params.gamma); // DEBUG LINE
        applyGammaCorrection(processedData.data, params.gamma);
        
        // 3. 应用三次插值CLAHE（恢复三次插值版本，替换之前的双线性插值实现，以更好地保留浅色区域细节）
        // script.js function: applyCubicCLAHE(data, width, height, clipLimit, tileSize)
        console.log('Applying Cubic CLAHE with parameters:', params.claheClipLimit, params.claheTileSize); // DEBUG LINE
        applyCubicCLAHE(processedData.data, processedData.width, processedData.height, params.claheClipLimit, params.claheTileSize);
        
        // 4. 应用全局亮度调整
        // script.js function: applyGlobalBrightness(data, blacksVal, whitesVal, highlightsVal, shadowsVal)
        applyGlobalBrightness(
            processedData.data,
            params.brightness.blacks,
            params.brightness.whites,
            params.brightness.highlights,
            params.brightness.shadows
        );
        
        // 5. 应用清晰度
        // script.js function: applyClarity(data, width, height, level)
        applyClarity(processedData.data, processedData.width, processedData.height, params.clarity);
        
        // 6. 应用USM锐化
        // script.js function: applyUnsharpMask(data, width, height, strength, radius, threshold)
        // IMPORTANT: params.usm.amount is scaled here from e.g. 75 to 0.75 for 'strength'
        applyUnsharpMask(
            processedData.data,
            processedData.width,
            processedData.height,
            params.usm.amount / 100.0, // Scale amount for 'strength'
            params.usm.radius,
            params.usm.threshold
        );
        
        // 转换为灰度图 - 激光雕刻需要
        // script.js function: convertToGrayscale(imageData)
        convertToGrayscale(processedData); 
        
        // 如果需要反色（深色材料），在灰度转换后应用
        if (params.invert) {
            invertImage(processedData.data);
        }
        
        return processedData;
    }
    
    // --- 图像处理函数 --- (Replaced with exact versions from script.js)

    // From script.js
    function truncate(value) {
        return Math.min(255, Math.max(0, Math.round(value)));
    }

    // From script.js
    function convertToGrayscale(imageData) {
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            // Using luminance formula (ITU-R BT.709)
            const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            data[i] = gray;     // Red
            data[i + 1] = gray; // Green
            data[i + 2] = gray; // Blue
        }
    }

    // From script.js
    function applyNormalContrast(data, level) { 
        // factor = (level / 100) but we want a more effective range.
        // Let's say level 100 is no change (factor 1).
        // Range 0-200. So 0 means factor 0, 100 means factor 1, 200 means factor 2.
        const factor = level / 100.0;
        for (let i = 0; i < data.length; i += 4) {
            data[i] = truncate(factor * (data[i] - 128) + 128);     // Red
            data[i+1] = truncate(factor * (data[i+1] - 128) + 128); // Green
            data[i+2] = truncate(factor * (data[i+2] - 128) + 128); // Blue
        }
    }

    // From script.js
    function applyGammaCorrection(data, gamma) {
        if (gamma <= 0) gamma = 0.01; // Prevent division by zero or invalid Math.pow results for gamma=0
        for (let i = 0; i < data.length; i += 4) {
            // Normalize to 0-1, apply gamma, then scale back to 0-255
            data[i] = truncate(255 * Math.pow(data[i] / 255, gamma));     // Red
            data[i+1] = truncate(255 * Math.pow(data[i+1] / 255, gamma)); // Green
            data[i+2] = truncate(255 * Math.pow(data[i+2] / 255, gamma)); // Blue
        }
    }
    
    // From script.js
    function applyGlobalBrightness(data, blacksVal, whitesVal, highlightsVal, shadowsVal) {
        // 1. Apply Blacks/Whites (Levels adjustment)
        // Map slider values (-100 to 100) to an adjustment factor (-50 to 50)
        const blackAdjustment = blacksVal * 0.5;
        const whiteAdjustment = whitesVal * 0.5;

        let inputBlack = blackAdjustment;         // Value in original that maps to 0. Effective range e.g., -50 to 50.
        let inputWhite = 255 + whiteAdjustment;   // Value in original that maps to 255. Effective range e.g., 205 to 305.

        if (inputBlack >= inputWhite - 1) { 
            inputBlack = 0;
            inputWhite = 255;
        }
        
        const levelRange = inputWhite - inputBlack;

        for (let i = 0; i < data.length; i += 4) {
            if (levelRange !== 0) { 
                data[i] = truncate((data[i] - inputBlack) * 255.0 / levelRange);
                data[i + 1] = truncate((data[i + 1] - inputBlack) * 255.0 / levelRange);
                data[i + 2] = truncate((data[i + 2] - inputBlack) * 255.0 / levelRange);
            }
            // If levelRange is 0, data remains unchanged, which is correct.
        }

        const shadowEffect = shadowsVal / 2.0; 
        const highlightEffect = highlightsVal / 2.0;

        for (let i = 0; i < data.length; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];

            if (shadowEffect !== 0) {
                const shadowFactorR = (255 - r) / 255.0;
                const shadowFactorG = (255 - g) / 255.0;
                const shadowFactorB = (255 - b) / 255.0;
                r = truncate(r + shadowEffect * shadowFactorR);
                g = truncate(g + shadowEffect * shadowFactorG);
                b = truncate(b + shadowEffect * shadowFactorB);
            }

            if (highlightEffect !== 0) {
                const highlightFactorR = r / 255.0;
                const highlightFactorG = g / 255.0;
                const highlightFactorB = b / 255.0;
                r = truncate(r + highlightEffect * highlightFactorR);
                g = truncate(g + highlightEffect * highlightFactorG);
                b = truncate(b + highlightEffect * highlightFactorB);
            }
            data[i] = r;
            data[i+1] = g;
            data[i+2] = b;
        }
    }

    // From script.js (approx lines 697-781), returns Uint8ClampedArray
    function createGaussianBlurredImage(originalDataSource, width, height, radius, darkPixelIgnoreThreshold) {
        const blurredArr = new Uint8ClampedArray(originalDataSource.length);
        const tempArr = new Uint8ClampedArray(originalDataSource.length); 

        const sigma = Math.max(0.1, radius); // Ensure sigma is positive
        const kernelRadius = Math.ceil(sigma * 3);
        const kernelSize = 2 * kernelRadius + 1;
        const kernel = new Float32Array(kernelSize);
        let kernelSum = 0;
        for (let i = 0; i < kernelSize; i++) {
            const x = i - kernelRadius;
            kernel[i] = Math.exp(-(x * x) / (2 * sigma * sigma));
            kernelSum += kernel[i];
        }
        // Normalize kernel
        if (kernelSum === 0) { 
            if (kernelSize > 0) { // Avoid division by zero if kernelSize is somehow 0
                 for (let i = 0; i < kernelSize; i++) kernel[i] = 1/kernelSize;
            } else {
                // This case should ideally not be reached if sigma > 0.1 and radius >=0
                // If kernelSize is 0, cannot proceed with blur. Maybe return original data or throw error.
                // For now, if this unlikely case happens, originalDataSource might be unchanged by this func.
                console.error("Gaussian blur kernel size is 0.");
                // Copy original to blurredArr to avoid returning uninitialized array
                for(let i=0; i < originalDataSource.length; i++) blurredArr[i] = originalDataSource[i];
                return blurredArr; 
            }
        } else {
            for (let i = 0; i < kernelSize; i++) {
                kernel[i] /= kernelSum;
            }
        }

        // Horizontal pass
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let sumR = 0, sumG = 0, sumB = 0;
                const centerPixelIndex = (y * width + x) * 4;
                const centerPixelOriginalValueR = originalDataSource[centerPixelIndex];
                const centerPixelOriginalValueG = originalDataSource[centerPixelIndex + 1];
                const centerPixelOriginalValueB = originalDataSource[centerPixelIndex + 2];
                const centerIsDark = centerPixelOriginalValueR < darkPixelIgnoreThreshold; 

                for (let k = -kernelRadius; k <= kernelRadius; k++) {
                    const currentX = Math.max(0, Math.min(width - 1, x + k));
                    const neighborPixelIdx = (y * width + currentX) * 4;
                    const neighborOriginalValueR = originalDataSource[neighborPixelIdx];
                    const neighborOriginalValueG = originalDataSource[neighborPixelIdx + 1];
                    const neighborOriginalValueB = originalDataSource[neighborPixelIdx + 2];
                    
                    let valueToUseR = neighborOriginalValueR;
                    let valueToUseG = neighborOriginalValueG;
                    let valueToUseB = neighborOriginalValueB;

                    if (!centerIsDark && neighborOriginalValueR < darkPixelIgnoreThreshold) { 
                        valueToUseR = centerPixelOriginalValueR;
                        valueToUseG = centerPixelOriginalValueG;
                        valueToUseB = centerPixelOriginalValueB;
                    }

                    const weight = kernel[k + kernelRadius];
                    sumR += valueToUseR * weight;
                    sumG += valueToUseG * weight; 
                    sumB += valueToUseB * weight; 
                }
                const targetIdx = (y * width + x) * 4;
                tempArr[targetIdx] = sumR;
                tempArr[targetIdx + 1] = sumG;
                tempArr[targetIdx + 2] = sumB;
                tempArr[targetIdx + 3] = originalDataSource[targetIdx + 3]; 
            }
        }

        // Vertical pass
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let sumR = 0, sumG = 0, sumB = 0;
                const centerPixelIndex = (y * width + x) * 4;
                const centerPixelOriginalValueR_forDecision = originalDataSource[centerPixelIndex];
                const centerPixelOriginalValueG_forDecision = originalDataSource[centerPixelIndex + 1];
                const centerPixelOriginalValueB_forDecision = originalDataSource[centerPixelIndex + 2];
                const centerIsDark = centerPixelOriginalValueR_forDecision < darkPixelIgnoreThreshold;

                for (let k = -kernelRadius; k <= kernelRadius; k++) {
                    const currentY = Math.max(0, Math.min(height - 1, y + k));
                    const neighborOriginalValueR_ForDecision = originalDataSource[(currentY * width + x) * 4]; 
                    const neighborValueFromTempR_ForSumming = tempArr[(currentY * width + x) * 4];
                    const neighborValueFromTempG_ForSumming = tempArr[(currentY * width + x) * 4 + 1];
                    const neighborValueFromTempB_ForSumming = tempArr[(currentY * width + x) * 4 + 2];
                    
                    let valueToUseR = neighborValueFromTempR_ForSumming;
                    let valueToUseG = neighborValueFromTempG_ForSumming;
                    let valueToUseB = neighborValueFromTempB_ForSumming;

                    if (!centerIsDark && neighborOriginalValueR_ForDecision < darkPixelIgnoreThreshold) {
                        valueToUseR = centerPixelOriginalValueR_forDecision; 
                        valueToUseG = centerPixelOriginalValueG_forDecision;
                        valueToUseB = centerPixelOriginalValueB_forDecision;
                    }

                    const weight = kernel[k + kernelRadius];
                    sumR += valueToUseR * weight;
                    sumG += valueToUseG * weight;
                    sumB += valueToUseB * weight;
                }
                const targetIdx = (y * width + x) * 4;
                blurredArr[targetIdx] = sumR;
                blurredArr[targetIdx + 1] = sumG;
                blurredArr[targetIdx + 2] = sumB;
                blurredArr[targetIdx + 3] = tempArr[targetIdx + 3]; 
            }
        }
        return blurredArr;
    }

    // From script.js
    function applyClarity(data, width, height, level) { 
        if (level === 0) return;

        const strength = level / 100.0; 
        const blurRadius = 2; // script.js uses 2 for clarity's blur sigma for createGaussianBlurredImage

        // Create a copy of 'data' for blurring, as createGaussianBlurredImage takes originalDataSource
        // and should not modify the 'data' array that clarity itself is modifying.
        const dataCopyForBlur = new Uint8ClampedArray(data.length);
        for(let k=0; k < data.length; k++) dataCopyForBlur[k] = data[k];

        // createGaussianBlurredImage (the new version) returns Uint8ClampedArray.
        // script.js uses darkPixelIgnoreThreshold = 0 for clarity's blur.
        const blurredDataArray = createGaussianBlurredImage(dataCopyForBlur, width, height, blurRadius, 0); 

        for (let i = 0; i < data.length; i += 4) {
            // Input 'data' to applyClarity in auto_processor is post-convertToGrayscale (R=G=B).
            // script.js applies to R, G, B separately. We follow that for exactness.
            data[i] = truncate(data[i] + strength * (data[i] - blurredDataArray[i]));
            data[i + 1] = truncate(data[i + 1] + strength * (data[i + 1] - blurredDataArray[i + 1]));
            data[i + 2] = truncate(data[i + 2] + strength * (data[i + 2] - blurredDataArray[i + 2]));
        }
    }

    // From script.js
    function applyUnsharpMask(data, width, height, strength, radius, threshold) {
        if (strength === 0) return;

        const intBlurRadius = Math.max(0, Math.round(radius)); 

        const originalDataSnapshot = new Uint8ClampedArray(data.length);
        for(let k=0; k < data.length; k++) originalDataSnapshot[k] = data[k];
        
        const VERY_DARK_THRESHOLD_FOR_BLUR_MODIFICATION = 0; 
        const gaussianBlurred = createGaussianBlurredImage(originalDataSnapshot, width, height, intBlurRadius, VERY_DARK_THRESHOLD_FOR_BLUR_MODIFICATION);

        const MAX_BILATERAL_KERNEL_RADIUS_FOR_USM = 3; 
        const actualKernelRadiusForBilateral = Math.min(intBlurRadius, MAX_BILATERAL_KERNEL_RADIUS_FOR_USM);
        const sigmaD_bilateral = Math.max(0.1, actualKernelRadiusForBilateral); 
        const sigmaR_bilateral = 15; 
        const bilateralBlurred = applyBilateralFilter(originalDataSnapshot, width, height, actualKernelRadiusForBilateral, sigmaD_bilateral, sigmaR_bilateral);

        const gaussianWeight = 0.7; 
        const combinedBlurredData = new Uint8ClampedArray(originalDataSnapshot.length);
        for (let i = 0; i < originalDataSnapshot.length; i += 4) {
            combinedBlurredData[i]   = gaussianWeight * gaussianBlurred[i]   + (1 - gaussianWeight) * bilateralBlurred[i];
            combinedBlurredData[i+1] = gaussianWeight * gaussianBlurred[i+1] + (1 - gaussianWeight) * bilateralBlurred[i+1];
            combinedBlurredData[i+2] = gaussianWeight * gaussianBlurred[i+2] + (1 - gaussianWeight) * bilateralBlurred[i+2];
            combinedBlurredData[i+3] = originalDataSnapshot[i+3]; 
        }
        const blurredData = combinedBlurredData; 
        
        const applyDarkProtectionMask = true; 
        const highlightProtectionStart = 204; 
        let protectionStrengthMask; 
        let currentProtectionLevel = 0.0;

        if (applyDarkProtectionMask) {
            const VERY_DARK_THRESHOLD_FOR_MASK_ANCHOR = 2; 
            const darkProtectionRadius = Math.max(0, intBlurRadius + 2); 
            
            protectionStrengthMask = new Float32Array(width * height).fill(0.0);

            if (darkProtectionRadius > 0) { 
                for (let yAnchor = 0; yAnchor < height; yAnchor++) {
                    for (let xAnchor = 0; xAnchor < width; xAnchor++) {
                        const anchorSnapshotIndex = (yAnchor * width + xAnchor) * 4;
                        if (originalDataSnapshot[anchorSnapshotIndex] < VERY_DARK_THRESHOLD_FOR_MASK_ANCHOR) {
                            for (let dy = -darkProtectionRadius; dy <= darkProtectionRadius; dy++) {
                                for (let dx = -darkProtectionRadius; dx <= darkProtectionRadius; dx++) {
                                    const nx = xAnchor + dx;
                                    const ny = yAnchor + dy;
                                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                                        const dist = Math.sqrt(dx * dx + dy * dy);
                                        let protectionVal = 0.0;
                                        if (dist <= darkProtectionRadius) {
                                            protectionVal = 1.0 - (dist / darkProtectionRadius);
                                        }
                                        protectionVal = Math.max(0, protectionVal); 
                                        const maskMapIndex = ny * width + nx;
                                        protectionStrengthMask[maskMapIndex] = Math.max(protectionStrengthMask[maskMapIndex], protectionVal);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const pixelMapIndex = y * width + x; 
                const imageDataIndex = pixelMapIndex * 4; 
                
                if (applyDarkProtectionMask && protectionStrengthMask) {
                    const darkProtectionRadiusForCheck = Math.max(0, intBlurRadius + 2); 
                    currentProtectionLevel = (darkProtectionRadiusForCheck > 0) ? protectionStrengthMask[pixelMapIndex] : 0.0;
                } else {
                    currentProtectionLevel = 0.0; 
                }

                for (let c = 0; c < 3; c++) { 
                    const channelIndex = imageDataIndex + c;
                    const originalPixel = originalDataSnapshot[channelIndex]; 
                    const blurredPixel = blurredData[channelIndex]; 
                    const diff = originalPixel - blurredPixel;

                    if (Math.abs(diff) >= threshold) {
                        let sharpeningAdjustment = strength * diff * (1.0 - currentProtectionLevel);
                        
                        if (sharpeningAdjustment > 0 && originalPixel > highlightProtectionStart) {
                            let factor = (255.0 - originalPixel) / (255.0 - highlightProtectionStart);
                            factor = Math.max(0, Math.min(1, factor)); 
                            sharpeningAdjustment *= (factor * factor); 
                        }
                        data[channelIndex] = truncate(originalPixel + sharpeningAdjustment);
                    } else {
                        data[channelIndex] = originalDataSnapshot[channelIndex];
                    }
                }
            }
        }
    }
    
    // From script.js 
    function applyCLAHE(data, width, height, clipLimit, tileSize) {
        console.log(`Applying CLAHE with Clip Limit: ${clipLimit}, Tile Size: ${tileSize}`);
        
        // 转换为亮度值数组以便处理
        const luminance = new Array(width * height);
        for (let i = 0, j = 0; i < data.length; i += 4, j++) {
            // 假设输入已经是灰度图像，所以 R=G=B
            luminance[j] = data[i];
        }
        
        // 将图像分成网格
        const numTilesX = Math.floor(width / tileSize) + (width % tileSize ? 1 : 0);
        const numTilesY = Math.floor(height / tileSize) + (height % tileSize ? 1 : 0);
        const actualTileWidth = Math.ceil(width / numTilesX);
        const actualTileHeight = Math.ceil(height / numTilesY);
        
        // 为每个瓦片创建直方图和映射表
        const tileHistograms = Array(numTilesY).fill().map(() => Array(numTilesX).fill().map(() => Array(256).fill(0)));
        const tileMappings = Array(numTilesY).fill().map(() => Array(numTilesX).fill().map(() => Array(256).fill(0)));
        
        // 第1步：计算每个瓦片的直方图
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const tileX = Math.min(Math.floor(x / actualTileWidth), numTilesX - 1);
                const tileY = Math.min(Math.floor(y / actualTileHeight), numTilesY - 1);
                const pixelIdx = y * width + x;
                const pixelValue = Math.round(luminance[pixelIdx]);
                tileHistograms[tileY][tileX][pixelValue]++;
            }
        }
        
        // 第2步：应用对比度限制，重新分配超出部分
        const getTilePixelCount = (tileX, tileY) => {
            const tileRight = Math.min((tileX + 1) * actualTileWidth, width);
            const tileBottom = Math.min((tileY + 1) * actualTileHeight, height);
            const tileLeft = tileX * actualTileWidth;
            const tileTop = tileY * actualTileHeight;
            return (tileRight - tileLeft) * (tileBottom - tileTop);
        };
        
        for (let tileY = 0; tileY < numTilesY; tileY++) {
            for (let tileX = 0; tileX < numTilesX; tileX++) {
                const tilePixelCount = getTilePixelCount(tileX, tileY);
                // 计算对比度限制阈值
                const clipThreshold = Math.max(1, (clipLimit * tilePixelCount) / 256);
                
                // 计算超出阈值的总数
                let excessTotal = 0;
                for (let i = 0; i < 256; i++) {
                    if (tileHistograms[tileY][tileX][i] > clipThreshold) {
                        excessTotal += tileHistograms[tileY][tileX][i] - clipThreshold;
                        tileHistograms[tileY][tileX][i] = clipThreshold;
                    }
                }
                
                // 重新分配超出部分
                const redistributeValue = excessTotal / 256;
                for (let i = 0; i < 256; i++) {
                    tileHistograms[tileY][tileX][i] += redistributeValue;
                }
                
                // 计算每个瓦片的CDF并创建映射表
                const cdf = new Array(256).fill(0);
                cdf[0] = tileHistograms[tileY][tileX][0];
                
                for (let i = 1; i < 256; i++) {
                    cdf[i] = cdf[i - 1] + tileHistograms[tileY][tileX][i];
                }
                
                // 规范化CDF到0-255范围
                const minCdf = cdf[0];
                const cdfRange = cdf[255] - minCdf;
                
                if (cdfRange > 0) {
                    for (let i = 0; i < 256; i++) {
                        tileMappings[tileY][tileX][i] = Math.round(((cdf[i] - minCdf) / cdfRange) * 255);
                    }
                } else {
                    // 如果所有像素值都相同，映射为原始值
                    for (let i = 0; i < 256; i++) {
                        tileMappings[tileY][tileX][i] = i;
                    }
                }
            }
        }
        
        // 第3步：双线性插值应用映射到图像
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                // 计算像素所在的瓦片和瓦片中的相对位置（归一化到0-1）
                const tileX = Math.min(Math.floor(x / actualTileWidth), numTilesX - 1);
                const tileY = Math.min(Math.floor(y / actualTileHeight), numTilesY - 1);
                
                const relX = (x % actualTileWidth) / actualTileWidth;
                const relY = (y % actualTileHeight) / actualTileHeight;
                
                // 确定相邻瓦片（考虑边界情况）
                const tileX2 = Math.min(tileX + 1, numTilesX - 1);
                const tileY2 = Math.min(tileY + 1, numTilesY - 1);
                
                // 获取原始像素值
                const pixelIdx = y * width + x;
                const pixelValue = Math.round(luminance[pixelIdx]);
                
                // 从四个角落的瓦片获取映射值
                const q11 = tileMappings[tileY][tileX][pixelValue];
                const q12 = tileMappings[tileY2][tileX][pixelValue];
                const q21 = tileMappings[tileY][tileX2][pixelValue];
                const q22 = tileMappings[tileY2][tileX2][pixelValue];
                
                // 双线性插值
                const r1 = q11 * (1 - relX) + q21 * relX;
                const r2 = q12 * (1 - relX) + q22 * relX;
                let newValue = r1 * (1 - relY) + r2 * relY;
                
                // 限制在0-255范围内
                newValue = Math.max(0, Math.min(255, newValue));
                
                // 将新值应用到图像
                const dataIdx = pixelIdx * 4;
                data[dataIdx] = newValue;
                data[dataIdx + 1] = newValue;
                data[dataIdx + 2] = newValue;
            }
        }
        
        console.log('CLAHE processing complete');
    }
    
    // 兼容旧的函数名称调用
    function applyCubicCLAHE(data, width, height, clipLimit, tileSize) {
        const luminance = new Array(width * height);
        const originalColors = new Array(width * height); 

        for (let i = 0, j = 0; i < data.length; i += 4, j++) {
            const r = data[i];
            const g = data[i+1];
            const b = data[i+2];
            originalColors[j] = {r,g,b};
            luminance[j] = 0.2126 * r + 0.7152 * g + 0.0722 * b; 
        }

        const numTilesX = Math.ceil(width / tileSize);
        const numTilesY = Math.ceil(height / tileSize);
        const tileMappings = Array(numTilesY).fill(null).map(() => Array(numTilesX).fill(null).map(() => new Uint8Array(256)));

        for (let tileY = 0; tileY < numTilesY; tileY++) {
            for (let tileX = 0; tileX < numTilesX; tileX++) {
                const startX = tileX * tileSize;
                const endX = Math.min(startX + tileSize, width);
                const startY = tileY * tileSize;
                const endY = Math.min(startY + tileSize, height);

                const hist = new Uint32Array(256); 
                let numPixelsInTile = 0;

                for (let y = startY; y < endY; y++) {
                    for (let x = startX; x < endX; x++) {
                        hist[Math.round(luminance[y * width + x])]++;
                        numPixelsInTile++;
                    }
                }

                if (numPixelsInTile === 0) { 
                    for(let i=0; i<256; i++) tileMappings[tileY][tileX][i] = i;
                    continue;
                }
                
                let actualClipLimit = Math.floor(clipLimit * numPixelsInTile / 256);
                if (actualClipLimit < 1) actualClipLimit = 1;

                let numExcess = 0;
                for (let i = 0; i < 256; i++) {
                    if (hist[i] > actualClipLimit) {
                        numExcess += hist[i] - actualClipLimit;
                        hist[i] = actualClipLimit;
                    }
                }
                const redistPerEntry = Math.floor(numExcess / 256);
                let numRemaining = numExcess % 256;

                for (let i = 0; i < 256; i++) {
                    hist[i] += redistPerEntry;
                }
                for (let i = 0; i < numRemaining; i++) {
                     hist[i % 256]++; 
                }

                const cdf = new Uint32Array(256);
                cdf[0] = hist[0];
                for (let i = 1; i < 256; i++) {
                    cdf[i] = cdf[i - 1] + hist[i];
                }

                const map = tileMappings[tileY][tileX];
                let cdfMin = cdf[0]; 
                for (let i = 0; i < 256; i++) { 
                    if (cdf[i] > 0) {
                        cdfMin = cdf[i];
                        break;
                    }
                }

                for (let i = 0; i < 256; i++) {
                    if (numPixelsInTile - cdfMin <= 0) { 
                        map[i] = i; 
                    } else {
                        map[i] = truncate( ( (cdf[i] - cdfMin) / (numPixelsInTile - cdfMin) ) * 255.0 );
                    }
                }
            }
        }
        
        function cubicInterpolate(p, x) { 
            return p[1] + 0.5 * x*(p[2] - p[0] + x*(2.0*p[0] - 5.0*p[1] + 4.0*p[2] - p[3] + x*(3.0*(p[1] - p[2]) + p[3] - p[0])));
        }

        function bicubicInterpolate(p_grid, x_frac, y_frac) { 
            const arr = new Array(4);
            arr[0] = cubicInterpolate(p_grid[0], x_frac);
            arr[1] = cubicInterpolate(p_grid[1], x_frac);
            arr[2] = cubicInterpolate(p_grid[2], x_frac);
            arr[3] = cubicInterpolate(p_grid[3], x_frac);
            return cubicInterpolate(arr, y_frac);
        }
        
        function clampTile(tileIdx, maxIdx) { 
            return Math.min(Math.max(tileIdx, 0), maxIdx);
        }

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const originalL = luminance[y * width + x];
                
                const tileXFloat = x / tileSize - 0.5;
                const tileYFloat = y / tileSize - 0.5;

                let x_frac = tileXFloat - Math.floor(tileXFloat);
                let y_frac = tileYFloat - Math.floor(tileYFloat);

                const currentTileX = Math.floor(tileXFloat);
                const currentTileY = Math.floor(tileYFloat);
                
                const p_grid = Array(4).fill(null).map(() => Array(4));

                for(let j=0; j<4; ++j) {
                    for(let i=0; i<4; ++i) {
                        const effTileY = clampTile(currentTileY + j - 1, numTilesY - 1);
                        const effTileX = clampTile(currentTileX + i - 1, numTilesX - 1);
                        p_grid[j][i] = tileMappings[effTileY][effTileX][Math.round(originalL)];
                    }
                }
                
                const newL = truncate(bicubicInterpolate(p_grid, x_frac, y_frac));
                const idx = (y * width + x) * 4;
                const {r,g,b} = originalColors[y * width + x];

                if (originalL > 0 && originalL < 255) { 
                    const ratio = newL / originalL;
                    data[idx] = truncate(r * ratio);
                    data[idx+1] = truncate(g * ratio);
                    data[idx+2] = truncate(b * ratio);
                } else if (newL === 0 && originalL === 0) { 
                     data[idx] = 0; data[idx+1] = 0; data[idx+2] = 0;
                } else { 
                     data[idx] = newL; data[idx+1] = newL; data[idx+2] = newL;
                }
            }
        }
    }

    // ADD THIS FUNCTION (from script.js lines ~1875-1970)
    function removeVerticalArtifacts(data, width, height, strength) {
        // console.log(`Applying vertical artifacts removal with strength: ${strength}`);
        const tempData = new Uint8ClampedArray(data.length);
        
        const kernelSize = 9; 
        const sigma = 2.0;    
        const kernel = new Float32Array(kernelSize);
        let kSum = 0; // Renamed from 'sum' in script.js to avoid conflict with other sums
        
        for (let i = 0; i < kernelSize; i++) {
            const x_k = i - Math.floor(kernelSize/2); // Renamed 'x' to 'x_k'
            kernel[i] = Math.exp(-(x_k*x_k)/(2*sigma*sigma));
            kSum += kernel[i];
        }
        
        if (kSum > 0) { 
            for (let i = 0; i < kernelSize; i++) {
                kernel[i] /= kSum;
            }
        } else { 
            if (kernelSize > 0) for (let i = 0; i < kernelSize; i++) kernel[i] = 1/kernelSize;
        }
            
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let r = 0, g = 0, b = 0;
                
                for (let k = 0; k < kernelSize; k++) {
                    const xOffset = k - Math.floor(kernelSize/2);
                    const targetX = Math.max(0, Math.min(width-1, x + xOffset));
                    const idx = (y * width + targetX) * 4;
                    
                    r += data[idx] * kernel[k];
                    g += data[idx+1] * kernel[k];
                    b += data[idx+2] * kernel[k];
                }
                
                const targetIdx = (y * width + x) * 4;
                tempData[targetIdx] = r;
                tempData[targetIdx+1] = g;
                tempData[targetIdx+2] = b;
                tempData[targetIdx+3] = data[targetIdx+3];
            }
        }
        
        const artifactStrengthMap = new Float32Array(width * height).fill(0.0); // Init with 0
        const detectionRadius = 1; // From script.js logic (immediate neighbors)
            
        for (let y = detectionRadius; y < height - detectionRadius; y++) {
            for (let x = detectionRadius; x < width - detectionRadius; x++) {
                const leftIdx = (y * width + (x - 1)) * 4;
                const rightIdx = (y * width + (x + 1)) * 4;
                const horizontalDiff = Math.abs(data[leftIdx] - data[rightIdx]); // Assuming R channel for diff
                
                const topIdx = ((y - 1) * width + x) * 4;
                const bottomIdx = ((y + 1) * width + x) * 4;
                const verticalDiff = Math.abs(data[topIdx] - data[bottomIdx]); // Assuming R channel for diff
                
                const ratio = (horizontalDiff + 0.01) / (verticalDiff + 0.01); 
                artifactStrengthMap[y * width + x] = Math.min(1.0, Math.max(0.0, (ratio - 1.0) * 0.5));
            }
        }
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const mapIdx = y * width + x;
                
                let adaptiveStrength = strength;
                if (y >= detectionRadius && y < height - detectionRadius && 
                    x >= detectionRadius && x < width - detectionRadius) {
                    adaptiveStrength = strength * (0.3 + 0.7 * artifactStrengthMap[mapIdx]); 
                } else {
                    adaptiveStrength = strength * 0.3; 
                }
                
                data[idx] = data[idx] * (1 - adaptiveStrength) + tempData[idx] * adaptiveStrength;
                data[idx + 1] = data[idx + 1] * (1 - adaptiveStrength) + tempData[idx + 1] * adaptiveStrength;
                data[idx + 2] = data[idx + 2] * (1 - adaptiveStrength) + tempData[idx + 2] * adaptiveStrength;
            }
        }
    }

    // --- Restored UI and Helper Functions specific to auto_processor.js ---

    // 显示处理后的图像
    function displayProcessedImage() {
        if (!processedImageData) return;
        
        const canvas = document.createElement('canvas');
        canvas.width = processedImageData.width;
        canvas.height = processedImageData.height;
        const ctx = canvas.getContext('2d');
        ctx.putImageData(processedImageData, 0, 0);
        
        processedPreview.innerHTML = '';
        processedPreview.appendChild(canvas);
    }
    
    // 更新分析结果显示
    function updateAnalysisDisplay() {
        let imageTypeText = '';
        let imageTypeClass = '';
        
        switch (detectedImageType) {
            case IMAGE_TYPES.CARTOON:
                imageTypeText = '卡通/线稿图像';
                imageTypeClass = 'tag-cartoon';
                
                // 卡通图像特殊分析显示 (异步添加，因为DOM需要先更新)
                setTimeout(() => {
                    // 为卡通图像添加关于伽马分析的特殊提示
                    const cartoonAnalysisDiv = document.createElement('div');
                    cartoonAnalysisDiv.className = 'cartoon-analysis-info';
                    cartoonAnalysisDiv.style.marginTop = '10px';
                    cartoonAnalysisDiv.style.padding = '5px';
                    cartoonAnalysisDiv.style.background = '#f8f9fa';
                    cartoonAnalysisDiv.style.borderRadius = '4px';
                    cartoonAnalysisDiv.style.fontSize = '14px';
                    
                    // 计算百分比值
                    const brightRatioPercent = (imageStats.brightRatio * 100).toFixed(1);
                    const darkRatioPercent = (imageStats.darkRatio * 100).toFixed(1);
                    
                    // 获取伽马值
                    const gammaValue = optimizedParams ? optimizedParams.gamma : 1.0;
                    
                    // 确定伽马效果描述
                    let gammaEffect = '';
                    if (gammaValue > 1.5) {
                        gammaEffect = '(中间调显著加深)';
                    } else if (gammaValue > 1.2) {
                        gammaEffect = '(中间调加深)';
                    } else if (gammaValue <= 0.8) {
                        gammaEffect = '(整体显著增亮)';
                    } else if (gammaValue < 0.9) {
                        gammaEffect = '(整体增亮)';
                    } else {
                        gammaEffect = '(平衡调整)';
                    }
                    
                    cartoonAnalysisDiv.innerHTML = `
                        <strong>卡通图像伽马分析:</strong><br>
                        亮区占比: <b>${brightRatioPercent}%</b> | 暗区占比: <b>${darkRatioPercent}%</b><br>
                        调整后伽马值: <b>${gammaValue}</b> ${gammaEffect}
                    `;
                    
                    // 在图像类型容器中添加分析信息
                    const typeContainer = document.getElementById('image-type-container');
                    if (typeContainer && !typeContainer.querySelector('.cartoon-analysis-info')) {
                        typeContainer.appendChild(cartoonAnalysisDiv);
                    }
                }, 100);
                break;
            case IMAGE_TYPES.PORTRAIT:
                imageTypeText = '人像图像';
                imageTypeClass = 'tag-portrait';
                break;
            case IMAGE_TYPES.TEXT:
                imageTypeText = '文本/图标图像';
                imageTypeClass = 'tag-text';
                break;
            case IMAGE_TYPES.PHOTO:
            default:
                imageTypeText = '普通照片图像';
                imageTypeClass = 'tag-photo';
                break;
        }
        
        imageTypeResult.innerHTML = `<span class="image-type-tag ${imageTypeClass}">${imageTypeText}</span>`;
        
        // 显示统计数据
        avgBrightness.textContent = imageStats.brightness.toFixed(1);
        contrastValue.textContent = imageStats.contrast.toFixed(1);
        darkRatio.textContent = (imageStats.darkRatio * 100).toFixed(1) + '%';
        brightRatio.textContent = (imageStats.brightRatio * 100).toFixed(1) + '%';
        
        // 更新增强的特征显示
        if (edgeComplexity) {
            edgeComplexity.textContent = (imageStats.distinctEdgeRatio * 100).toFixed(1) + '%';
            detailRichness.textContent = (imageStats.detailRichness * 100).toFixed(1) + '%';
            smoothness.textContent = (imageStats.smoothness * 100).toFixed(1) + '%';
        }
        
        if (document.getElementById('histogram-peaks')) {
            document.getElementById('histogram-peaks').textContent = imageStats.peaks || '-';
            if (imageStats.peakPositions && imageStats.peakPositions.length > 0) {
                document.getElementById('peak-positions').textContent = 
                    imageStats.peakPositions.slice(0, 3).map(p => p).join(', ');
            }
        }
        
        if (document.getElementById('bw-ratio')) {
            document.getElementById('bw-ratio').textContent = 
                imageStats.bwRatio ? (imageStats.bwRatio * 100).toFixed(1) + '%' : '-';
        }
        
        if (document.getElementById('color-simplicity')) {
            document.getElementById('color-simplicity').textContent = 
                imageStats.colorSimplicity ? (imageStats.colorSimplicity * 100).toFixed(1) + '%' : '-';
        }
        
        let depthValue = '中等';
        if (detectedImageType === IMAGE_TYPES.CARTOON || detectedImageType === IMAGE_TYPES.TEXT) {
            depthValue = '深度';
        } else if (detectedImageType === IMAGE_TYPES.PORTRAIT) {
            depthValue = '中等';
        } else if (imageStats.contrast < 40 || imageStats.brightness < 80) {
            depthValue = '浅度';
        }
        
        if (recommendedDepth) {
            recommendedDepth.textContent = depthValue;
        }
        
        paramContrast.textContent = optimizedParams.contrast;
        paramGamma.textContent = optimizedParams.gamma.toFixed(2);
        paramClahe.textContent = `限制=${optimizedParams.claheClipLimit.toFixed(1)}, 尺寸=${optimizedParams.claheTileSize}`;
        paramClarity.textContent = optimizedParams.clarity;
        
        const brightnessParams = [];
        if (optimizedParams.brightness.highlights !== 0) {
            brightnessParams.push(`高光=${optimizedParams.brightness.highlights}`);
        }
        if (optimizedParams.brightness.shadows !== 0) {
            brightnessParams.push(`阴影=${optimizedParams.brightness.shadows}`);
        }
        if (optimizedParams.brightness.whites !== 0) {
            brightnessParams.push(`白色=${optimizedParams.brightness.whites}`);
        }
        if (optimizedParams.brightness.blacks !== 0) {
            brightnessParams.push(`黑色=${optimizedParams.brightness.blacks}`);
        }
        
        paramBrightness.textContent = brightnessParams.length > 0 ? brightnessParams.join(', ') : '无调整';
        paramUsm.textContent = `强度=${optimizedParams.usm.amount}, 半径=${optimizedParams.usm.radius}, 阈值=${optimizedParams.usm.threshold}`;
        
        const optimizationSummary = document.getElementById('optimization-summary');
        if (optimizationSummary) {
            let summaryText = `基于${imageTypeText}的优化策略：`;
            switch (detectedImageType) {
                case IMAGE_TYPES.CARTOON: 
                    if (imageStats.brightRatio > 0.3) {
                        summaryText += '增强线条清晰度，保持白色区域不变，增加伽马值加深中间调'; 
                    } else if (imageStats.darkRatio > 0.85) {
                        summaryText += '增强线条清晰度，保持白色区域不变，极大降低伽马值(0.6)使极暗图像明显增亮';
                    } else if (imageStats.darkRatio > 0.4) {
                        summaryText += '增强线条清晰度，保持白色区域不变，显著降低伽马值使暗区更明显';
                    } else {
                        summaryText += '增强线条清晰度，保持白色区域不变，适度调整中间调';
                    }
                    break;
                case IMAGE_TYPES.PORTRAIT: summaryText += '保留面部细节，增强皮肤纹理，中和对比度'; break;
                case IMAGE_TYPES.TEXT: summaryText += '最大化文本清晰度，增强边缘锐度'; break;
                case IMAGE_TYPES.PHOTO: summaryText += '平衡整体细节，增强纹理层次感，保持自然色调过渡'; break;
            }
            optimizationSummary.textContent = summaryText;
        }
    }
    
    // 绘制直方图
    function drawHistogram(canvas, originalData, processedData) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width = 400;
        const height = canvas.height = 150;
        
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(0, 0, width, height);
        
        const originalHistogram = new Array(256).fill(0);
        const processedHistogram = new Array(256).fill(0);
        
        for (let i = 0; i < originalData.data.length; i += 4) {
            const r = originalData.data[i];
            const g = originalData.data[i + 1];
            const b = originalData.data[i + 2];
            const brightness = Math.round(0.299 * r + 0.587 * g + 0.114 * b); // Or use BT.709 if consistent elsewhere
            originalHistogram[brightness]++;
        }
        
        for (let i = 0; i < processedData.data.length; i += 4) {
            const r = processedData.data[i];
            const g = processedData.data[i + 1];
            const b = processedData.data[i + 2];
            const brightness = Math.round(0.299 * r + 0.587 * g + 0.114 * b); // Or use BT.709
            processedHistogram[brightness]++;
        }
        
        const maxOriginal = Math.max(...originalHistogram);
        const maxProcessed = Math.max(...processedHistogram);
        const maxValue = Math.max(maxOriginal, maxProcessed, 1); // Avoid division by zero if all are 0
        
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 5; i++) {
            const y = height - (i * height / 4) - 20;
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
        }
        for (let i = 0; i <= 4; i++) {
            const x = i * width / 4;
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height - 20); ctx.stroke();
        }
        
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';
        ctx.font = '10px Arial';
        for (let i = 0; i <= 4; i++) {
            const x = i * width / 4;
            ctx.fillText(Math.round(i * 255 / 4).toString(), x, height - 5);
        }
        
        const gradientHeight = 10;
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, '#000000');
        gradient.addColorStop(1, '#ffffff');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, height - 20, width, gradientHeight);
        
        const legendSize = 12, legendPadding = 5;
        ctx.fillStyle = 'rgba(52, 152, 219, 0.9)';
        ctx.fillRect(10, 10, legendSize, legendSize);
        ctx.fillStyle = '#333';
        ctx.textAlign = 'left';
        ctx.fillText('原始图像', 10 + legendSize + legendPadding, 10 + legendSize - 2);
        ctx.fillStyle = 'rgba(231, 76, 60, 0.9)';
        ctx.fillRect(100, 10, legendSize, legendSize);
        ctx.fillStyle = '#333';
        ctx.fillText('处理后图像', 100 + legendSize + legendPadding, 10 + legendSize - 2);
        
        function plotHistogram(histData, colorStroke, colorFill) {
            ctx.strokeStyle = colorStroke;
            ctx.fillStyle = colorFill;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            for (let i = 0; i < 256; i++) {
                const x = i * width / 256;
                const y = height - 20 - (histData[i] / maxValue) * (height - 30);
                if (i === 0) { ctx.moveTo(x, height - 20); ctx.lineTo(x, y); }
                else { ctx.lineTo(x, y); }
            }
            ctx.lineTo(width, height - 20);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        plotHistogram(originalHistogram, 'rgba(52, 152, 219, 0.8)', 'rgba(52, 152, 219, 0.3)');
        plotHistogram(processedHistogram, 'rgba(231, 76, 60, 0.8)', 'rgba(231, 76, 60, 0.3)');
    }
    
    // 下载处理后的图像
    function downloadProcessedImage() {
        if (!processedImageData) return;
        
        const canvas = document.createElement('canvas');
        canvas.width = processedImageData.width;
        canvas.height = processedImageData.height;
        const ctx = canvas.getContext('2d');
        ctx.putImageData(processedImageData, 0, 0);
        
        const link = document.createElement('a');
        link.download = '激光雕刻优化图像.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }
    
    // 跳转到手动编辑页面
    function redirectToManualEdit() {
        if (!originalImage) return;
        
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = 'index.html'; // Assuming index.html can handle POSTed image data
        form.target = '_blank';
        
        const imageInput = document.createElement('input');
        imageInput.type = 'hidden';
        imageInput.name = 'imageData';
        imageInput.value = originalImage.src; // Send original image data URL
        form.appendChild(imageInput);
        
        const paramsInput = document.createElement('input');
        paramsInput.type = 'hidden';
        paramsInput.name = 'presetParams';
        paramsInput.value = JSON.stringify(optimizedParams); // Send optimized params
        form.appendChild(paramsInput);
        
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    }

    // 以下是从imageProcessor.js导入的高级图像分析函数 (这些应该保留)
    
    /**
     * 分析直方图特征 - 从img4laser项目导入
     * @param {Array} histogram - 灰度直方图
     * @returns {Object} 直方图特征
     */
    function analyzeHistogramFeatures(histogram) {
        const total = histogram.reduce((sum, val) => sum + val, 0);
        const normalized = histogram.map(v => v / total);
        
        // 平滑直方图减少噪声
        const smoothed = [];
        for (let i = 0; i < normalized.length; i++) {
            let sum = 0;
            let count = 0;
            for (let j = Math.max(0, i - 2); j <= Math.min(255, i + 2); j++) {
                sum += normalized[j];
                count++;
            }
            smoothed[i] = sum / count;
        }
        
        // 寻找峰值
        const peaks = [];
        const peakThreshold = 0.002; // 阈值提高到 0.2%
        for (let i = 2; i < 254; i++) {
            if (smoothed[i] > peakThreshold &&
                smoothed[i] > smoothed[i - 1] &&
                smoothed[i] > smoothed[i - 2] && 
                smoothed[i] >= smoothed[i + 1] && 
                smoothed[i] >= smoothed[i + 2]) {
                
                // 确保峰值比附近低点高出一些
                const localMinLeft = Math.min(smoothed[i - 1], smoothed[i - 2]);
                const localMinRight = Math.min(smoothed[i + 1], smoothed[i + 2]);
                if (smoothed[i] > localMinLeft * 1.1 && smoothed[i] > localMinRight * 1.1) {
                    peaks.push({
                        position: i,
                        height: smoothed[i]
                    });
                }
            }
        }
        
        // 如果上面没找到，尝试更简单的峰值查找
        if (peaks.length === 0) {
            for (let i = 1; i < 255; i++) {
                if (smoothed[i] > peakThreshold && 
                   smoothed[i] > smoothed[i-1] && 
                   smoothed[i] >= smoothed[i+1]) {
                   if (peaks.length === 0 || Math.abs(i - peaks[peaks.length - 1].position) > 3) {
                        peaks.push({ position: i, height: smoothed[i] });
                   }
                }
            }
        }

        peaks.sort((a, b) => b.height - a.height); // 按高度排序
        
        // 计算黑白占比
        let bwPixels = 0;
        const bwThresholdLow = 10;
        const bwThresholdHigh = 245;
        const totalPixels = histogram.reduce((sum, count) => sum + count, 0);
        if (totalPixels > 0) {
            for (let i = 0; i <= bwThresholdLow; i++) {
                bwPixels += (histogram[i] || 0);
            }
            for (let i = bwThresholdHigh; i <= 255; i++) {
                bwPixels += (histogram[i] || 0);
            }
        }
        const bwRatio = totalPixels > 0 ? bwPixels / totalPixels : 0;

        // 计算谷深度
        let valleyDepth = 0;
        if (peaks.length >= 2) {
            const peak1Pos = peaks[0].position;
            const peak2Pos = peaks[1].position;
            const startPos = Math.min(peak1Pos, peak2Pos);
            const endPos = Math.max(peak1Pos, peak2Pos);
            
            if (endPos - startPos > 5) {
                let minHeightBetween = 1;
                for (let i = startPos + 1; i < endPos; i++) {
                     if (smoothed[i] < minHeightBetween) {
                        minHeightBetween = smoothed[i];
                    }
                }
                const lowerPeakHeight = Math.min(peaks[0].height, peaks[1].height);
                if (lowerPeakHeight > 0 && minHeightBetween < lowerPeakHeight * 0.9) { 
                   valleyDepth = 1 - (minHeightBetween / lowerPeakHeight);
                }
            }
        }
        
        return {
            peakCount: peaks.length,
            peaks: peaks.slice(0, 3),
            valleyDepth: valleyDepth,
            bwRatio: bwRatio
        };
    }
    
    /**
     * 分析边缘特征 - 从img4laser项目导入
     * @param {ImageData} grayImage - 灰度图像
     * @returns {Object} 边缘特征
     */
    function analyzeEdgeFeatures(grayImage) {
        const data = grayImage.data;
        const width = grayImage.width;
        const height = grayImage.height;
        
        // 边缘图
        const edgeMap = new Uint8Array(width * height);
        const edgeStrength = new Uint8Array(width * height);
        
        // 边缘检测 (改进版Sobel)
        let edgeCount = 0;
        let distinctEdgeCount = 0;
        let totalContrast = 0;
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = y * width + x;
                
                // 获取3x3邻域
                const p00 = data[((y-1) * width + (x-1)) * 4];
                const p01 = data[((y-1) * width + x) * 4];
                const p02 = data[((y-1) * width + (x+1)) * 4];
                const p10 = data[(y * width + (x-1)) * 4];
                const p11 = data[(y * width + x) * 4];
                const p12 = data[(y * width + (x+1)) * 4];
                const p20 = data[((y+1) * width + (x-1)) * 4];
                const p21 = data[((y+1) * width + x) * 4];
                const p22 = data[((y+1) * width + (x+1)) * 4];
                
                // Sobel算子
                const gx = ((p02 + 2*p12 + p22) - (p00 + 2*p10 + p20));
                const gy = ((p20 + 2*p21 + p22) - (p00 + 2*p01 + p02));
                
                // 梯度幅值
                const gradient = Math.sqrt(gx*gx + gy*gy);
                
                // 边缘强度
                edgeStrength[idx] = Math.min(255, Math.round(gradient));
                
                // 判断边缘
                if (gradient > 20) {
                    edgeMap[idx] = 1;
                    edgeCount++;
                    totalContrast += gradient;
                    
                    if (gradient > 50) {
                        distinctEdgeCount++;
                    }
                }
            }
        }
        
        // 查找长边 (连通区域分析)
        let longEdgeCount = 0;
        const visited = new Uint8Array(width * height);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;
                
                if (edgeMap[idx] && !visited[idx]) {
                    // 使用广度优先搜索查找连通区域
                    const queue = [{x, y}];
                    let size = 0;
                    let totalX = 0, totalY = 0;
                    let minX = x, maxX = x, minY = y, maxY = y;
                    
                    visited[idx] = 1;
                    
                    while (queue.length > 0 && size < 1000) {
                        const {x: cx, y: cy} = queue.shift();
                        const cidx = cy * width + cx;
                        
                        size++;
                        totalX += cx;
                        totalY += cy;
                        
                        // 更新边界
                        minX = Math.min(minX, cx);
                        maxX = Math.max(maxX, cx);
                        minY = Math.min(minY, cy);
                        maxY = Math.max(maxY, cy);
                        
                        // 检查8邻域
                        const neighbors = [
                            {x: cx-1, y: cy}, {x: cx+1, y: cy},
                            {x: cx, y: cy-1}, {x: cx, y: cy+1},
                            {x: cx-1, y: cy-1}, {x: cx+1, y: cy-1},
                            {x: cx-1, y: cy+1}, {x: cx+1, y: cy+1}
                        ];
                        
                        for (const {x: nx, y: ny} of neighbors) {
                            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                                const nidx = ny * width + nx;
                                if (edgeMap[nidx] && !visited[nidx]) {
                                    queue.push({x: nx, y: ny});
                                    visited[nidx] = 1;
                                }
                            }
                        }
                    }
                    
                    // 分析连通区域特征
                    if (size > 15) {
                        // 计算边缘的线性度
                        const width = maxX - minX + 1;
                        const height = maxY - minY + 1;
                        const boxArea = width * height;
                        const density = size / boxArea;
                        
                        // 长直边缘的线性度高，密度低
                        if ((width > 20 || height > 20) && (density < 0.5 || size > 30)) {
                            longEdgeCount++;
                        }
                    }
                }
            }
        }
        
        // 计算平均边缘对比度
        const avgContrast = edgeCount > 0 ? totalContrast / edgeCount : 0;
        
        return {
            edgeRatio: edgeCount / (width * height),
            distinctEdgeRatio: distinctEdgeCount / (width * height),
            longEdgeRatio: longEdgeCount / (width * height * 0.01), // 归一化
            edgeContrast: avgContrast
        };
    }
    
    /**
     * 分析纹理特征 - 从img4laser项目导入
     * @param {ImageData} grayImage - 灰度图像
     * @returns {Object} 纹理特征
     */
    function analyzeTextureFeatures(grayImage) {
        const data = grayImage.data;
        const width = grayImage.width;
        const height = grayImage.height;
        
        // 降采样并量化图像来减少计算量
        const blockSize = 4; // 4x4块
        const quantizedWidth = Math.floor(width / blockSize);
        const quantizedHeight = Math.floor(height / blockSize);
        const quantized = new Uint8Array(quantizedWidth * quantizedHeight);
        
        // 计算颜色单一性
        let grayLevels = new Set();
        const colorSampleStep = 4; // 采样步长
        let colorSampledPixels = 0;
        
        for (let i = 0; i < data.length; i += 4 * colorSampleStep) {
            if (i < data.length) {
                // 量化为32个灰度级别
                const quantizedGray = Math.floor(data[i] / 8);
                grayLevels.add(quantizedGray);
                colorSampledPixels++;
            }
        }
        
        // 颜色单一性指标
        const colorSimplicity = 1 - (grayLevels.size / 32); // 值越高表示颜色越单一
        
        for (let y = 0; y < quantizedHeight; y++) {
            for (let x = 0; x < quantizedWidth; x++) {
                // 计算块的平均值
                let sum = 0;
                let count = 0;
                
                for (let by = 0; by < blockSize; by++) {
                    for (let bx = 0; bx < blockSize; bx++) {
                        const srcX = x * blockSize + bx;
                        const srcY = y * blockSize + by;
                        
                        if (srcX < width && srcY < height) {
                            const idx = (srcY * width + srcX) * 4;
                            sum += data[idx];
                            count++;
                        }
                    }
                }
                
                const avg = Math.round(sum / count);
                // 8级量化 (0-7)，合并相似灰度
                quantized[y * quantizedWidth + x] = Math.floor(avg / 32);
            }
        }
        
        // 计算低方差区域的总像素面积占比
        let totalLowVariancePixels = 0;
        const varBlockSize = 3; // 3x3块
        const lowVarianceThreshold = 30; // 方差阈值
        
        for (let y = 0; y < height - varBlockSize; y += varBlockSize) {
            for (let x = 0; x < width - varBlockSize; x += varBlockSize) {
                let sum = 0;
                let sumSq = 0;
                let count = 0;
                
                // 计算块的均值和方差
                for (let by = 0; by < varBlockSize; by++) {
                    for (let bx = 0; bx < varBlockSize; bx++) {
                        const idx = ((y + by) * width + (x + bx)) * 4;
                        const val = data[idx];
                        sum += val;
                        sumSq += val * val;
                        count++;
                    }
                }
                
                const mean = sum / count;
                const variance = (sumSq / count) - (mean * mean);
                
                // 低方差 = 平滑区域
                if (variance < lowVarianceThreshold) {
                    totalLowVariancePixels += count; // 累加块内的像素数量
                }
            }
        }
        const totalPixels = width * height;
        const lowVarianceAreaRatio = totalPixels > 0 ? totalLowVariancePixels / totalPixels : 0;
        
        // 找到连通的色块
        const colorBlocks = findColorBlocks(quantized, quantizedWidth, quantizedHeight);
        
        // 检测皮肤色调
        let skinPixels = 0;
        const skipFactor = 4; // 降低采样间隔
        let sampledPixels = 0;
        
        for (let i = 0; i < data.length; i += 4 * skipFactor) {
            if (i + 2 < data.length) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                
                // 改进的肤色检测
                const basicSkinCondition = r > 60 && g > 40 && b > 20 && r > g && r > b;
                
                // 标准肤色 - 较严格的条件
                const standardSkin = basicSkinCondition && 
                                 r - g > 15 && 
                                 r - b > 20 && r - b < 120;
                                 
                // 高亮肤色 - 适用于彩色照片中偏亮的肤色
                const brightSkin = r > 150 && g > 120 && b > 100 && 
                                 r > g + 10 && g > b && 
                                 r - b < 140;
                                 
                // 粉红色肤色 - 适用于带粉色色调的照片
                const pinkSkin = r > 180 && g > 120 && b > 120 && 
                               r - g > 20 && g - b < 20;
                
                if (standardSkin || brightSkin || pinkSkin) {
                    skinPixels++;
                }
                
                sampledPixels++;
            }
        }
        
        return {
            colorBlockCount: colorBlocks.length,
            lowVarianceAreaRatio: lowVarianceAreaRatio,
            skinToneRatio: skinPixels / sampledPixels,
            colorSimplicity: colorSimplicity
        };
    }
    
    /**
     * 查找色块 (连通区域) - 从img4laser项目导入
     * @param {Uint8Array} quantized - 量化后的图像数据
     * @param {number} width - 图像宽度
     * @param {number} height - 图像高度
     * @returns {Array} 色块列表
     */
    function findColorBlocks(quantized, width, height) {
        const visited = new Uint8Array(width * height);
        const blocks = [];
        const minBlockSize = 4; // 最小色块大小
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;
                
                if (!visited[idx]) {
                    const color = quantized[idx];
                    // BFS寻找连通区域
                    const queue = [{x, y}];
                    let size = 0;
                    
                    visited[idx] = 1;
                    
                    while (queue.length > 0 && size < 1000) { // 限制大小避免大区域计算过久
                        const curr = queue.shift();
                        size++;
                        
                        // 检查4邻域
                        const neighbors = [
                            {x: curr.x-1, y: curr.y},
                            {x: curr.x+1, y: curr.y},
                            {x: curr.x, y: curr.y-1},
                            {x: curr.x, y: curr.y+1}
                        ];
                        
                        for (const {x: nx, y: ny} of neighbors) {
                            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                                const nidx = ny * width + nx;
                                
                                if (!visited[nidx] && quantized[nidx] === color) {
                                    queue.push({x: nx, y: ny});
                                    visited[nidx] = 1;
                                }
                            }
                        }
                    }
                    
                    // 只记录大于最小值的色块
                    if (size >= minBlockSize) {
                        blocks.push({
                            color: color,
                            size: size
                        });
                    }
                }
            }
        }
        
        return blocks;
    }
    
    /**
     * 计算平滑度 - 检测图像的局部平滑程度
     * @param {ImageData} imageData - 图像数据 
     * @returns {Object} 平滑度数据
     */
    function calculateSmoothness(imageData) {
        const { data, width, height } = imageData;
        const blockSize = 8; // 局部区域大小
        const numBlocksX = Math.floor(width / blockSize);
        const numBlocksY = Math.floor(height / blockSize);
        
        let totalVariance = 0;
        let blockCount = 0;
        let smoothRegions = 0;
        const varianceThreshold = 100; // 平滑区域的方差阈值
        
        // 计算局部区域的方差
        for (let blockY = 0; blockY < numBlocksY; blockY++) {
            for (let blockX = 0; blockX < numBlocksX; blockX++) {
                let sum = 0;
                let sumSq = 0;
                let count = 0;
                
                // 计算块内像素的和与平方和
                for (let y = 0; y < blockSize; y++) {
                    for (let x = 0; x < blockSize; x++) {
                        const pixelX = blockX * blockSize + x;
                        const pixelY = blockY * blockSize + y;
                        
                        if (pixelX < width && pixelY < height) {
                            const idx = (pixelY * width + pixelX) * 4;
                            const brightness = Math.round(
                                0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]
                            );
                            
                            sum += brightness;
                            sumSq += brightness * brightness;
                            count++;
                        }
                    }
                }
                
                if (count > 0) {
                    const mean = sum / count;
                    const variance = (sumSq / count) - (mean * mean);
                    
                    totalVariance += variance;
                    blockCount++;
                    
                    if (variance < varianceThreshold) {
                        smoothRegions++;
                    }
                }
            }
        }
        
        const avgVariance = totalVariance / (blockCount || 1);
        const smoothness = smoothRegions / (blockCount || 1);
        
        return { smoothness, avgVariance };
    }

    // --- Add back the updateOptimization function if it was removed ---
    // 当材质或激光功率变化时更新优化
    function updateOptimization() {
        if (imageStats && detectedImageType && originalImageData) { // Ensure all needed data is available
            // 显示加载指示器
            const loadingIndicator = showLoading(processedPreview);
            
            // 使用setTimeout让UI有时间更新
            setTimeout(() => {
                try {
                    // 获取新的优化参数
                    optimizedParams = getOptimizedParams(
                        detectedImageType,
                        materialTypeSelect.value,
                        laserTypeSelect.value
                    );
                    
                    // 保存推荐的Gamma值
                    recommendedGamma = optimizedParams.gamma;
                    
                    // Create a fresh copy of originalImageData for processing
                    const originalDataCopy = new ImageData(
                        new Uint8ClampedArray(originalImageData.data),
                        originalImageData.width,
                        originalImageData.height
                    );

                    // 处理图像
                    processedImageData = processImage(originalDataCopy, optimizedParams);
                    displayProcessedImage(); 
                    updateAnalysisDisplay(); 
                    
                    // 更新直方图
                    if (histogramCanvas && originalImageData && processedImageData) { // Guard against null canvas/data
                        drawHistogram(histogramCanvas, originalImageData, processedImageData);
                    }
                    
                    // 更新Gamma控件
                    gammaSlider.value = recommendedGamma;
                    gammaValueDisplay.textContent = recommendedGamma.toFixed(2);
                } catch (error) {
                    console.error('更新优化参数失败:', error);
                } finally {
                    // 隐藏加载指示器
                    hideLoading();
                }
            }, 50);
        }
    }

    // ADD THIS FUNCTION from script.js (approx lines 783-827)
    // Placed before applyClarity which might use it if it were part of a more complex clarity.
    // More importantly, applyUnsharpMask (to be updated next) will use it.
    function applyBilateralFilter(originalDataSource, width, height, kernelRadius, sigmaD, sigmaR) {
        const filteredArr = new Uint8ClampedArray(originalDataSource.length);
        if (sigmaD <= 0) sigmaD = 0.1; // Ensure sigmaD is positive
        if (sigmaR <= 0) sigmaR = 0.1; // Ensure sigmaR is positive

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let sumWeightedPixelR = 0;
                let sumWeightedPixelG = 0;
                let sumWeightedPixelB = 0;
                let sumWeights = 0;
                const centerPixelIndex = (y * width + x) * 4;
                const centerPixelValueR = originalDataSource[centerPixelIndex];
                const centerPixelValueG = originalDataSource[centerPixelIndex + 1];
                const centerPixelValueB = originalDataSource[centerPixelIndex + 2];

                for (let ky = -kernelRadius; ky <= kernelRadius; ky++) {
                    for (let kx = -kernelRadius; kx <= kernelRadius; kx++) {
                        const currentY = Math.max(0, Math.min(height - 1, y + ky));
                        const currentX = Math.max(0, Math.min(width - 1, x + kx));
                        
                        const neighborPixelIndex = (currentY * width + currentX) * 4;
                        const neighborPixelValueR = originalDataSource[neighborPixelIndex];
                        const neighborPixelValueG = originalDataSource[neighborPixelIndex + 1];
                        const neighborPixelValueB = originalDataSource[neighborPixelIndex + 2];

                        const spatialDistSq = (kx * kx) + (ky * ky);
                        const weightSpatial = Math.exp(-spatialDistSq / (2 * sigmaD * sigmaD));
                        
                        const rangeDistSqR = (centerPixelValueR - neighborPixelValueR) * (centerPixelValueR - neighborPixelValueR);
                        const weightRangeR = Math.exp(-rangeDistSqR / (2 * sigmaR * sigmaR));
                        
                        const totalWeight = weightSpatial * weightRangeR; 
                        
                        sumWeightedPixelR += neighborPixelValueR * totalWeight;
                        sumWeightedPixelG += neighborPixelValueG * totalWeight; 
                        sumWeightedPixelB += neighborPixelValueB * totalWeight; 
                        sumWeights += totalWeight;
                    }
                }

                filteredArr[centerPixelIndex]     = sumWeights === 0 ? centerPixelValueR : sumWeightedPixelR / sumWeights;
                filteredArr[centerPixelIndex + 1] = sumWeights === 0 ? centerPixelValueG : sumWeightedPixelG / sumWeights;
                filteredArr[centerPixelIndex + 2] = sumWeights === 0 ? centerPixelValueB : sumWeightedPixelB / sumWeights;
                filteredArr[centerPixelIndex + 3] = originalDataSource[centerPixelIndex + 3]; 
            }
        }
        return filteredArr;
    }

    function applyClarity(data, width, height, level) { 
        if (level === 0) return;

        const strength = level / 100.0; 
        const blurRadius = 2; // script.js uses 2 for clarity's blur sigma for createGaussianBlurredImage

        // Create a copy of 'data' for blurring, as createGaussianBlurredImage takes originalDataSource
        // and should not modify the 'data' array that clarity itself is modifying.
        const dataCopyForBlur = new Uint8ClampedArray(data.length);
        for(let k=0; k < data.length; k++) dataCopyForBlur[k] = data[k];

        // createGaussianBlurredImage (the new version) returns Uint8ClampedArray.
        // script.js uses darkPixelIgnoreThreshold = 0 for clarity's blur.
        const blurredDataArray = createGaussianBlurredImage(dataCopyForBlur, width, height, blurRadius, 0); 

        for (let i = 0; i < data.length; i += 4) {
            // Input 'data' to applyClarity in auto_processor is post-convertToGrayscale (R=G=B).
            // script.js applies to R, G, B separately. We follow that for exactness.
            data[i] = truncate(data[i] + strength * (data[i] - blurredDataArray[i]));
            data[i + 1] = truncate(data[i + 1] + strength * (data[i + 1] - blurredDataArray[i + 1]));
            data[i + 2] = truncate(data[i + 2] + strength * (data[i + 2] - blurredDataArray[i + 2]));
        }
    }

    function applyUnsharpMask(data, width, height, strength, radius, threshold) {
        if (strength === 0) return;

        const intBlurRadius = Math.max(0, Math.round(radius)); 

        const originalDataSnapshot = new Uint8ClampedArray(data.length);
        for(let k=0; k < data.length; k++) originalDataSnapshot[k] = data[k];
        
        const VERY_DARK_THRESHOLD_FOR_BLUR_MODIFICATION = 0; 
        const gaussianBlurred = createGaussianBlurredImage(originalDataSnapshot, width, height, intBlurRadius, VERY_DARK_THRESHOLD_FOR_BLUR_MODIFICATION);

        const MAX_BILATERAL_KERNEL_RADIUS_FOR_USM = 3; 
        const actualKernelRadiusForBilateral = Math.min(intBlurRadius, MAX_BILATERAL_KERNEL_RADIUS_FOR_USM);
        const sigmaD_bilateral = Math.max(0.1, actualKernelRadiusForBilateral); 
        const sigmaR_bilateral = 15; 
        const bilateralBlurred = applyBilateralFilter(originalDataSnapshot, width, height, actualKernelRadiusForBilateral, sigmaD_bilateral, sigmaR_bilateral);

        const gaussianWeight = 0.7; 
        const combinedBlurredData = new Uint8ClampedArray(originalDataSnapshot.length);
        for (let i = 0; i < originalDataSnapshot.length; i += 4) {
            combinedBlurredData[i]   = gaussianWeight * gaussianBlurred[i]   + (1 - gaussianWeight) * bilateralBlurred[i];
            combinedBlurredData[i+1] = gaussianWeight * gaussianBlurred[i+1] + (1 - gaussianWeight) * bilateralBlurred[i+1];
            combinedBlurredData[i+2] = gaussianWeight * gaussianBlurred[i+2] + (1 - gaussianWeight) * bilateralBlurred[i+2];
            combinedBlurredData[i+3] = originalDataSnapshot[i+3]; 
        }
        const blurredData = combinedBlurredData; 
        
        const applyDarkProtectionMask = true; 
        const highlightProtectionStart = 204; 
        let protectionStrengthMask; 
        let currentProtectionLevel = 0.0;

        if (applyDarkProtectionMask) {
            const VERY_DARK_THRESHOLD_FOR_MASK_ANCHOR = 2; 
            const darkProtectionRadius = Math.max(0, intBlurRadius + 2); 
            
            protectionStrengthMask = new Float32Array(width * height).fill(0.0);

            if (darkProtectionRadius > 0) { 
                for (let yAnchor = 0; yAnchor < height; yAnchor++) {
                    for (let xAnchor = 0; xAnchor < width; xAnchor++) {
                        const anchorSnapshotIndex = (yAnchor * width + xAnchor) * 4;
                        if (originalDataSnapshot[anchorSnapshotIndex] < VERY_DARK_THRESHOLD_FOR_MASK_ANCHOR) {
                            for (let dy = -darkProtectionRadius; dy <= darkProtectionRadius; dy++) {
                                for (let dx = -darkProtectionRadius; dx <= darkProtectionRadius; dx++) {
                                    const nx = xAnchor + dx;
                                    const ny = yAnchor + dy;
                                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                                        const dist = Math.sqrt(dx * dx + dy * dy);
                                        let protectionVal = 0.0;
                                        if (dist <= darkProtectionRadius) {
                                            protectionVal = 1.0 - (dist / darkProtectionRadius);
                                        }
                                        protectionVal = Math.max(0, protectionVal); 
                                        const maskMapIndex = ny * width + nx;
                                        protectionStrengthMask[maskMapIndex] = Math.max(protectionStrengthMask[maskMapIndex], protectionVal);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const pixelMapIndex = y * width + x; 
                const imageDataIndex = pixelMapIndex * 4; 
                
                if (applyDarkProtectionMask && protectionStrengthMask) {
                    const darkProtectionRadiusForCheck = Math.max(0, intBlurRadius + 2); 
                    currentProtectionLevel = (darkProtectionRadiusForCheck > 0) ? protectionStrengthMask[pixelMapIndex] : 0.0;
                } else {
                    currentProtectionLevel = 0.0; 
                }

                for (let c = 0; c < 3; c++) { 
                    const channelIndex = imageDataIndex + c;
                    const originalPixel = originalDataSnapshot[channelIndex]; 
                    const blurredPixel = blurredData[channelIndex]; 
                    const diff = originalPixel - blurredPixel;

                    if (Math.abs(diff) >= threshold) {
                        let sharpeningAdjustment = strength * diff * (1.0 - currentProtectionLevel);
                        
                        if (sharpeningAdjustment > 0 && originalPixel > highlightProtectionStart) {
                            let factor = (255.0 - originalPixel) / (255.0 - highlightProtectionStart);
                            factor = Math.max(0, Math.min(1, factor)); 
                            sharpeningAdjustment *= (factor * factor); 
                        }
                        data[channelIndex] = truncate(originalPixel + sharpeningAdjustment);
                    } else {
                        data[channelIndex] = originalDataSnapshot[channelIndex];
                    }
                }
            }
        }
    }

    // 已删除重复的applyCubicCLAHE实现，使用上面定义的标准CLAHE版本

    // ADD THIS FUNCTION (from script.js lines ~1875-1970)
    function removeVerticalArtifacts(data, width, height, strength) {
        // console.log(`Applying vertical artifacts removal with strength: ${strength}`);
        const tempData = new Uint8ClampedArray(data.length);
        
        const kernelSize = 9; 
        const sigma = 2.0;    
        const kernel = new Float32Array(kernelSize);
        let kSum = 0; // Renamed from 'sum' in script.js to avoid conflict with other sums
        
        for (let i = 0; i < kernelSize; i++) {
            const x_k = i - Math.floor(kernelSize/2); // Renamed 'x' to 'x_k'
            kernel[i] = Math.exp(-(x_k*x_k)/(2*sigma*sigma));
            kSum += kernel[i];
        }
        
        if (kSum > 0) { 
            for (let i = 0; i < kernelSize; i++) {
                kernel[i] /= kSum;
            }
        } else { 
            if (kernelSize > 0) for (let i = 0; i < kernelSize; i++) kernel[i] = 1/kernelSize;
        }
            
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let r = 0, g = 0, b = 0;
                
                for (let k = 0; k < kernelSize; k++) {
                    const xOffset = k - Math.floor(kernelSize/2);
                    const targetX = Math.max(0, Math.min(width-1, x + xOffset));
                    const idx = (y * width + targetX) * 4;
                    
                    r += data[idx] * kernel[k];
                    g += data[idx+1] * kernel[k];
                    b += data[idx+2] * kernel[k];
                }
                
                const targetIdx = (y * width + x) * 4;
                tempData[targetIdx] = r;
                tempData[targetIdx+1] = g;
                tempData[targetIdx+2] = b;
                tempData[targetIdx+3] = data[targetIdx+3];
            }
        }
        
        const artifactStrengthMap = new Float32Array(width * height).fill(0.0); // Init with 0
        const detectionRadius = 1; // From script.js logic (immediate neighbors)
            
        for (let y = detectionRadius; y < height - detectionRadius; y++) {
            for (let x = detectionRadius; x < width - detectionRadius; x++) {
                const leftIdx = (y * width + (x - 1)) * 4;
                const rightIdx = (y * width + (x + 1)) * 4;
                const horizontalDiff = Math.abs(data[leftIdx] - data[rightIdx]); // Assuming R channel for diff
                
                const topIdx = ((y - 1) * width + x) * 4;
                const bottomIdx = ((y + 1) * width + x) * 4;
                const verticalDiff = Math.abs(data[topIdx] - data[bottomIdx]); // Assuming R channel for diff
                
                const ratio = (horizontalDiff + 0.01) / (verticalDiff + 0.01); 
                artifactStrengthMap[y * width + x] = Math.min(1.0, Math.max(0.0, (ratio - 1.0) * 0.5));
            }
        }
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const mapIdx = y * width + x;
                
                let adaptiveStrength = strength;
                if (y >= detectionRadius && y < height - detectionRadius && 
                    x >= detectionRadius && x < width - detectionRadius) {
                    adaptiveStrength = strength * (0.3 + 0.7 * artifactStrengthMap[mapIdx]); 
                } else {
                    adaptiveStrength = strength * 0.3; 
                }
                
                data[idx] = data[idx] * (1 - adaptiveStrength) + tempData[idx] * adaptiveStrength;
                data[idx + 1] = data[idx + 1] * (1 - adaptiveStrength) + tempData[idx + 1] * adaptiveStrength;
                data[idx + 2] = data[idx + 2] * (1 - adaptiveStrength) + tempData[idx + 2] * adaptiveStrength;
            }
        }
    }

    // 添加反色函数
    function invertImage(data) {
        for (let i = 0; i < data.length; i += 4) {
            data[i] = 255 - data[i];         // 反转红色通道
            data[i + 1] = 255 - data[i + 1]; // 反转绿色通道
            data[i + 2] = 255 - data[i + 2]; // 反转蓝色通道
            // 不修改Alpha通道
        }
    }
}); 