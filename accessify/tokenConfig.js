export const defaultMapping = {
  'Marketo: Product Newsletter': {
    'mapping': {
      'marketoHeader': {
        '_type': 'Component',
        'map': {
          'fromName': { '_type': 'TextField', 'mktoToken': 'M1#MH#FromName' },
          'fromEmail': { '_type': 'TextField', 'mktoToken': 'M1#MH#FromEmail' },
          'subject': { '_type': 'TextField', 'mktoToken': 'M1#MH#Subject' },
          'preheader': { '_type': 'TextField', 'mktoToken': 'M1#MH#Preheader' },
          'bannerImage': { '_type': 'AssetField', 'mktoToken': 'M1#MH#BannerImage' },
          'summary': { '_type': 'RichTextField', 'mktoToken': 'M1#MH#Summary' }
        }
      },
      'thumbnails': {
        'behaviour': 'List',
        '_type': 'URLField',
        'elements': [
          { 'mktoToken': 'M1#MH#thumbnail1' },
          { 'mktoToken': 'M1#MH#thumbnail2' },
          { 'mktoToken': 'M1#MH#thumbnail2' },
          { 'mktoToken': 'M1#MH#thumbnail2' }
        ]
      },
      'productReleaseSummary': {
        'behaviour': 'List',
        '_type': 'Component',
        'elements': [
          {
            'map': {
              'title': { '_type': 'TextField', 'mktoToken': 'M2#PRS#Title' },
              'overview': { '_type': 'RichTextField', 'mktoToken': 'M2#PRS#Overview' },
              'featureInformation': { '_type': 'RichTextField', 'mktoToken': 'M2#PRS#FeatInfo' },
              'image': { '_type': 'AssetField', 'mktoToken': 'M2#PRS#BodyImage' }
            }
          },
          {
            'map': {
              'title': { '_type': 'TextField', 'mktoToken': 'M3#PRS#Title' },
              'overview': { '_type': 'RichTextField', 'mktoToken': 'M3#PRS#Overview' },
              'featureInformation': { '_type': 'RichTextField', 'mktoToken': 'M3#PRS#FeatInfo' },
              'image': { '_type': 'AssetField', 'mktoToken': 'M3#PRS#BodyImage' }
            }
          },
          {
            'map': {
              'title': { '_type': 'TextField', 'mktoToken': 'M4#PRS#Title' },
              'overview': { '_type': 'RichTextField', 'mktoToken': 'M4#PRS#Overview' },
              'featureInformation': { '_type': 'RichTextField', 'mktoToken': 'M4#PRS#FeatInfo' },
              'image': { '_type': 'AssetField', 'mktoToken': 'M4#PRS#BodyImage' }
            }
          },
          {
            'map': {
              'title': { '_type': 'TextField', 'mktoToken': 'M5#PRS#Title' },
              'overview': { '_type': 'RichTextField', 'mktoToken': 'M5#PRS#Overview' },
              'featureInformation': { '_type': 'RichTextField', 'mktoToken': 'M5#PRS#FeatInfo' },
              'image': { '_type': 'AssetField', 'mktoToken': 'M5#PRS#BodyImage' }
            }
          },
          {
            'map': {
              'title': { '_type': 'TextField', 'mktoToken': 'M6#PRS#Title' },
              'overview': { '_type': 'RichTextField', 'mktoToken': 'M6#PRS#Overview' },
              'featureInformation': { '_type': 'RichTextField', 'mktoToken': 'M6#PRS#FeatInfo' },
              'image': { '_type': 'AssetField', 'mktoToken': 'M6#PRS#BodyImage' }
            }
          },
          {
            'map': {
              'title': { '_type': 'TextField', 'mktoToken': 'M7#PRS#Title' },
              'overview': { '_type': 'RichTextField', 'mktoToken': 'M7#PRS#Overview' },
              'featureInformation': { '_type': 'RichTextField', 'mktoToken': 'M7#PRS#FeatInfo' },
              'image': { '_type': 'AssetField', 'mktoToken': 'M7#PRS#BodyImage' }
            }
          },
          {
            'map': {
              'title': { '_type': 'TextField', 'mktoToken': 'M8#PRS#Title' },
              'overview': { '_type': 'RichTextField', 'mktoToken': 'M8#PRS#Overview' },
              'featureInformation': { '_type': 'RichTextField', 'mktoToken': 'M8#PRS#FeatInfo' },
              'image': { '_type': 'AssetField', 'mktoToken': 'M8#PRS#BodyImage' }
            }
          },
          {
            'map': {
              'title': { '_type': 'TextField', 'mktoToken': 'M9#PRS#Title' },
              'overview': { '_type': 'RichTextField', 'mktoToken': 'M9#PRS#Overview' },
              'featureInformation': { '_type': 'RichTextField', 'mktoToken': 'M9#PRS#FeatInfo' },
              'image': { '_type': 'AssetField', 'mktoToken': 'M9#PRS#BodyImage' }
            }
          },
          {
            'map': {
              'title': { '_type': 'TextField', 'mktoToken': 'M10#PRS#Title' },
              'overview': { '_type': 'RichTextField', 'mktoToken': 'M10#PRS#Overview' },
              'featureInformation': { '_type': 'RichTextField', 'mktoToken': 'M10#PRS#FeatInfo' },
              'image': { '_type': 'AssetField', 'mktoToken': 'M10#PRS#BodyImage' }
            }
          },
          {
            'map': {
              'title': { '_type': 'TextField', 'mktoToken': 'M18#PRS#Title' },
              'overview': { '_type': 'RichTextField', 'mktoToken': 'M18#PRS#Overview' },
              'featureInformation': { '_type': 'RichTextField', 'mktoToken': 'M18#PRS#FeatInfo' },
              'image': { '_type': 'AssetField', 'mktoToken': 'M18#PRS#BodyImage' }
            }
          },
        ]
      },
      'upcomingReleases': {
        'behaviour': 'List',
        '_type': 'Component',
        'elements': [
          {
            'map': {
              'title': { '_type': 'TextField', 'mktoToken': 'M11#UR#Title' },
              'overview': { '_type': 'RichTextField', 'mktoToken': 'M11#UR#Overview' },
              'featureInformation': { '_type': 'RichTextField', 'mktoToken': 'M11#UR#FeatInfo' },
              'image': { '_type': 'AssetField', 'mktoToken': 'M11#UR#BodyImage' }
            }
          },
          {
            'map': {
              'title': { '_type': 'TextField', 'mktoToken': 'M12#UR#Title' },
              'overview': { '_type': 'RichTextField', 'mktoToken': 'M12#UR#Overview' },
              'featureInformation': { '_type': 'RichTextField', 'mktoToken': 'M12#UR#FeatInfo' },
              'image': { '_type': 'AssetField', 'mktoToken': 'M12#UR#BodyImage' }
            }
          },
          {
            'map': {
              'title': { '_type': 'TextField', 'mktoToken': 'M13#UR#Title' },
              'overview': { '_type': 'RichTextField', 'mktoToken': 'M13#UR#Overview' },
              'featureInformation': { '_type': 'RichTextField', 'mktoToken': 'M13#UR#FeatInfo' },
              'image': { '_type': 'AssetField', 'mktoToken': 'M13#UR#BodyImage' }
            }
          },
          {
            'map': {
              'title': { '_type': 'TextField', 'mktoToken': 'M14#UR#Title' },
              'overview': { '_type': 'RichTextField', 'mktoToken': 'M14#UR#Overview' },
              'featureInformation': { '_type': 'RichTextField', 'mktoToken': 'M14#UR#FeatInfo' },
              'image': { '_type': 'AssetField', 'mktoToken': 'M14#UR#BodyImage' }
            }
          },
          {
            'map': {
              'title': { '_type': 'TextField', 'mktoToken': 'M15#UR#Title' },
              'overview': { '_type': 'RichTextField', 'mktoToken': 'M15#UR#Overview' },
              'featureInformation': { '_type': 'RichTextField', 'mktoToken': 'M15#UR#FeatInfo' },
              'image': { '_type': 'AssetField', 'mktoToken': 'M15#UR#BodyImage' }
            }
          },
          {
            'map': {
              'title': { '_type': 'TextField', 'mktoToken': 'M16#UR#Title' },
              'overview': { '_type': 'RichTextField', 'mktoToken': 'M16#UR#Overview' },
              'featureInformation': { '_type': 'RichTextField', 'mktoToken': 'M16#UR#FeatInfo' },
              'image': { '_type': 'AssetField', 'mktoToken': 'M16#UR#BodyImage' }
            }
          },
          {
            'map': {
              'title': { '_type': 'TextField', 'mktoToken': 'M17#UR#Title' },
              'overview': { '_type': 'RichTextField', 'mktoToken': 'M17#UR#Overview' },
              'featureInformation': { '_type': 'RichTextField', 'mktoToken': 'M17#UR#FeatInfo' },
              'image': { '_type': 'AssetField', 'mktoToken': 'M17#UR#BodyImage' }
            }
          },
          {
            'map': {
              'title': { '_type': 'TextField', 'mktoToken': 'M19#UR#Title' },
              'overview': { '_type': 'RichTextField', 'mktoToken': 'M19#UR#Overview' },
              'featureInformation': { '_type': 'RichTextField', 'mktoToken': 'M19#UR#FeatInfo' },
              'image': { '_type': 'AssetField', 'mktoToken': 'M19#UR#BodyImage' }
            }
          },
          {
            'map': {
              'title': { '_type': 'TextField', 'mktoToken': 'M20#UR#Title' },
              'overview': { '_type': 'RichTextField', 'mktoToken': 'M20#UR#Overview' },
              'featureInformation': { '_type': 'RichTextField', 'mktoToken': 'M20#UR#FeatInfo' },
              'image': { '_type': 'AssetField', 'mktoToken': 'M20#UR#BodyImage' }
            }
          },
          {
            'map': {
              'title': { '_type': 'TextField', 'mktoToken': 'M21#UR#Title' },
              'overview': { '_type': 'RichTextField', 'mktoToken': 'M21#UR#Overview' },
              'featureInformation': { '_type': 'RichTextField', 'mktoToken': 'M21#UR#FeatInfo' },
              'image': { '_type': 'AssetField', 'mktoToken': 'M21#UR#BodyImage' }
            }
          }
        ]
      },
      'whatsNext': {
        'behaviour': 'List',
        '_type': 'Component',
        'elements': [
          {
            'map': {
              'whatsNext': { '_type': 'TextField', 'mktoToken': 'M22#WN#WN' },
              'Summary': { '_type': 'RichTextField', 'mktoToken': 'M22#WN#Summary' },
            }
          },
          {
            'map': {
              'whatsNext': { '_type': 'TextField', 'mktoToken': 'M23#WN#WN' },
              'Summary': { '_type': 'RichTextField', 'mktoToken': 'M23#WN#Summary' },
            }
          }
        ]
      }
    },
    'programId': 1024
  }
};
