const getCartProductListQuery=(user_id=null)=>{
    if(user_id){
    return `WITH cart_data AS (
    SELECT
        json_build_object(
            'id', MIN(i.id),

            'inventory_id', MAX(i.inventory_id),

            'title', MAX(i.title),

            'type_name', MAX(i.type_name),

            'ratings', MAX(i.ratings),

            'dimension_length', MAX(i.dimension_length),

            'dimension_width', MAX(i.dimension_width),

            'dimension_thickness', MAX(i.dimension_thickness),

            'description1', MAX(i.description1),

            'description2', MAX(i.description2),

            'material', MAX(i.material),

            'border', MAX(i.border),

            'pallu', MAX(i.pallu),

            'blouse', MAX(i.blouse),

            'color', MAX(i.color),

            'handloom', BOOL_OR(i.handloom),

            'popularity_status', BOOL_OR(i.popularity_status),

            'trending_status', BOOL_OR(i.trending_status),

            'quantity', c.quantity,

            'base_price',

            (
                (
                    ROUND(
                        (
                            MAX(i.act_price) +
                            (
                                MAX(i.act_price) * MAX(m.margin_percent) / 100.0
                            )
                        ) / 100.0
                    ) * 100
                ) - 1
            ),

            'comparable_price',

            (
                (
                    ROUND(
                        (
                            (
                                (
                                    ROUND(
                                        (
                                            MAX(i.act_price) +
                                            (
                                                MAX(i.act_price) * MAX(m.margin_percent) / 100.0
                                            )
                                        ) / 100.0
                                    ) * 100
                                ) - 1
                            )
                            +
                            (
                                (
                                    (
                                        ROUND(
                                            (
                                                MAX(i.act_price) +
                                                (
                                                    MAX(i.act_price) * MAX(m.margin_percent) / 100.0
                                                )
                                            ) / 100.0
                                        ) * 100
                                    ) - 1
                                )
                                * MAX(m.comparable_price_percent) / 100.0
                            )
                        ) / 100.0
                    ) * 100
                ) - 1
            ),

            'total_price',

            (
                (
                    (
                        ROUND(
                            (
                                MAX(i.act_price) +
                                (
                                    MAX(i.act_price) * MAX(m.margin_percent) / 100.0
                                )
                            ) / 100.0
                        ) * 100
                    ) - 1
                ) * c.quantity
            ),

            'custom_message',

            CASE
                WHEN SUM(i.quantity) > 3 THEN 'In Stock'
                WHEN SUM(i.quantity) = 2 THEN 'Only 2 left'
                WHEN SUM(i.quantity) = 1 THEN 'Only 1 left'
                ELSE 'Only 3 left'
            END,

            'img_directory', MAX(i.img_directory),

            'video_directory', MAX(i.video_directory),

            'combined_code', i.combined_code

        ) AS row_data,

        (
            (
                (
                    ROUND(
                        (
                            MAX(i.act_price) +
                            (
                                MAX(i.act_price) * MAX(m.margin_percent) / 100.0
                            )
                        ) / 100.0
                    ) * 100
                ) - 1
            ) * c.quantity
        ) AS total_price

    FROM public.inventory_elements i

    LEFT JOIN public.margin_ranges m
        ON i.act_price BETWEEN m.price_from AND m.price_until

    JOIN cart c
        ON c.inventory_element_id = i.id

    WHERE
        c.user_id = $1

    GROUP BY
        i.combined_code,
        c.quantity
)

SELECT json_build_object(
    'items', COALESCE(
        json_agg(row_data),
        '[]'::json
    ),

    'grand_total_price', SUM(total_price)

) AS data

FROM cart_data;`
    }
    else{
        return `WITH cart_data AS (
    SELECT
        json_build_object(
            'id', MIN(i.id),

            'inventory_id', MAX(i.inventory_id),

            'title', MAX(i.title),

            'type_name', MAX(i.type_name),

            'ratings', MAX(i.ratings),

            'dimension_length', MAX(i.dimension_length),

            'dimension_width', MAX(i.dimension_width),

            'dimension_thickness', MAX(i.dimension_thickness),

            'description1', MAX(i.description1),

            'description2', MAX(i.description2),

            'material', MAX(i.material),

            'border', MAX(i.border),

            'pallu', MAX(i.pallu),

            'blouse', MAX(i.blouse),

            'color', MAX(i.color),

            'handloom', BOOL_OR(i.handloom),

            'popularity_status', BOOL_OR(i.popularity_status),

            'trending_status', BOOL_OR(i.trending_status),

            'quantity', c.quantity,

            'base_price',

            (
                (
                    ROUND(
                        (
                            MAX(i.act_price) +
                            (
                                MAX(i.act_price) * MAX(m.margin_percent) / 100.0
                            )
                        ) / 100.0
                    ) * 100
                ) - 1
            ),

            'comparable_price',

            (
                (
                    ROUND(
                        (
                            (
                                (
                                    ROUND(
                                        (
                                            MAX(i.act_price) +
                                            (
                                                MAX(i.act_price) * MAX(m.margin_percent) / 100.0
                                            )
                                        ) / 100.0
                                    ) * 100
                                ) - 1
                            )
                            +
                            (
                                (
                                    (
                                        ROUND(
                                            (
                                                MAX(i.act_price) +
                                                (
                                                    MAX(i.act_price) * MAX(m.margin_percent) / 100.0
                                                )
                                            ) / 100.0
                                        ) * 100
                                    ) - 1
                                )
                                * MAX(m.comparable_price_percent) / 100.0
                            )
                        ) / 100.0
                    ) * 100
                ) - 1
            ),

            'total_price',

            (
                (
                    (
                        ROUND(
                            (
                                MAX(i.act_price) +
                                (
                                    MAX(i.act_price) * MAX(m.margin_percent) / 100.0
                                )
                            ) / 100.0
                        ) * 100
                    ) - 1
                ) * c.quantity
            ),

            'custom_message',

            CASE
                WHEN SUM(i.quantity) > 3 THEN 'In Stock'
                WHEN SUM(i.quantity) = 2 THEN 'Only 2 left'
                WHEN SUM(i.quantity) = 1 THEN 'Only 1 left'
                ELSE 'Only 3 left'
            END,

            'img_directory', MAX(i.img_directory),

            'video_directory', MAX(i.video_directory),

            'combined_code', i.combined_code

        ) AS row_data,

        (
            (
                (
                    ROUND(
                        (
                            MAX(i.act_price) +
                            (
                                MAX(i.act_price) * MAX(m.margin_percent) / 100.0
                            )
                        ) / 100.0
                    ) * 100
                ) - 1
            ) * c.quantity
        ) AS total_price

    FROM public.inventory_elements i

    LEFT JOIN public.margin_ranges m
        ON i.act_price BETWEEN m.price_from AND m.price_until

    JOIN cart c
        ON c.inventory_element_id = i.id

    WHERE
        c.ip_address = $1
        AND c.user_agent = $2

    GROUP BY
        i.combined_code,
        c.quantity
)

SELECT json_build_object(
    'items', COALESCE(
        json_agg(row_data),
        '[]'::json
    ),

    'grand_total_price', SUM(total_price)

) AS data

FROM cart_data;`
    }
};
module.exports=getCartProductListQuery;